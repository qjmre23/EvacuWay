"""
EvacuWay — statistical analysis over the 270-run experiment.

Experiment design: 3 strategies x 3 flood levels x 30 seeds = 270 runs.
Provides:
* batch execution + JSON persistence (one file per run, plus aggregate summary)
* one-way ANOVA across strategies (per KPI, per flood level)
* Tukey HSD post-hoc, Cohen's f effect size, Levene homogeneity, Shapiro normality.
"""
from __future__ import annotations

import json
from itertools import product
from typing import Any

import numpy as np
import pandas as pd

from . import config
from .simulation import get_simulator


# --------------------------------------------------------------------------- #
# Batch execution
# --------------------------------------------------------------------------- #
def run_full_experiment(persist: bool = True, progress: bool = False) -> pd.DataFrame:
    sim = get_simulator()
    rows: list[dict[str, Any]] = []
    combos = list(product(config.STRATEGIES, config.FLOOD_LEVELS, config.SEEDS))
    for i, (strat, flood, seed) in enumerate(combos, 1):
        res = sim.run(strat, flood, seed)
        row = {"run_id": res.run_id, "strategy": strat, "flood_level": flood, "seed": seed,
               "closed_edges": res.closed_edges, "total_agents": res.total_agents,
               "completed_agents": res.completed_agents, **res.kpis}
        rows.append(row)
        if persist:
            (config.RESULTS_DIR / f"{res.run_id}.json").write_text(
                json.dumps(res.to_dict(), indent=2), encoding="utf-8")
        if progress and i % 30 == 0:
            print(f"  ... {i}/{len(combos)} runs complete")

    df = pd.DataFrame(rows)
    if persist:
        df.to_csv(config.RESULTS_DIR / "all_runs.csv", index=False)
        summary = aggregate(df)
        (config.RESULTS_DIR / "summary.json").write_text(
            json.dumps(summary, indent=2), encoding="utf-8")
    return df


def aggregate(df: pd.DataFrame) -> dict[str, Any]:
    """Mean KPI per (strategy, flood_level) cell — the contents of Table 4."""
    kpis = ["TET", "AET", "ECR", "NUI", "EI", "SCP"]
    cells = []
    for strat in config.STRATEGIES:
        for flood in config.FLOOD_LEVELS:
            sub = df[(df.strategy == strat) & (df.flood_level == flood)]
            if sub.empty:
                continue
            cell = {"strategy": strat, "flood_level": flood, "n": int(len(sub))}
            for k in kpis:
                cell[k] = round(float(sub[k].mean()), 3)
                cell[f"{k}_std"] = round(float(sub[k].std(ddof=1)), 3)
            cells.append(cell)
    return {"cells": cells, "n_runs": int(len(df)), "kpis": kpis}


# --------------------------------------------------------------------------- #
# Inferential statistics
# --------------------------------------------------------------------------- #
def _cohens_f(groups: list[np.ndarray]) -> float:
    grand = np.concatenate(groups)
    grand_mean = grand.mean()
    ss_between = sum(len(g) * (g.mean() - grand_mean) ** 2 for g in groups)
    ss_total = ((grand - grand_mean) ** 2).sum()
    if ss_total == 0:
        return 0.0
    eta2 = ss_between / ss_total
    if eta2 >= 1.0:
        return float("inf")
    return float(np.sqrt(eta2 / (1 - eta2)))


def anova_by_strategy(df: pd.DataFrame, kpi: str = "TET", flood_level: str | None = None) -> dict[str, Any]:
    """One-way ANOVA: factor = strategy (3 levels), dependent variable = ``kpi``."""
    from scipy import stats

    data = df if flood_level is None else df[df.flood_level == flood_level]
    groups = [data[data.strategy == s][kpi].to_numpy() for s in config.STRATEGIES]
    groups = [g for g in groups if len(g) > 1]
    if len(groups) < 2:
        return {"error": "insufficient data"}

    f_stat, p_val = stats.f_oneway(*groups)
    k = len(groups)
    n = sum(len(g) for g in groups)
    df_between, df_within = k - 1, n - k

    # assumption checks
    try:
        levene_stat, levene_p = stats.levene(*groups)
    except Exception:
        levene_stat, levene_p = float("nan"), float("nan")
    shapiro = {}
    for s, g in zip(config.STRATEGIES, groups):
        try:
            w, p = stats.shapiro(g)
            shapiro[s] = {"W": round(float(w), 4), "p": round(float(p), 4)}
        except Exception:
            shapiro[s] = {"W": None, "p": None}

    grand = np.concatenate(groups)
    grand_mean = grand.mean()
    ss_between = sum(len(g) * (g.mean() - grand_mean) ** 2 for g in groups)
    ss_total = float(((grand - grand_mean) ** 2).sum())
    partial_eta2 = ss_between / ss_total if ss_total else 0.0

    return {
        "kpi": kpi,
        "flood_level": flood_level or "all",
        "F": round(float(f_stat), 4),
        "p_value": float(p_val),
        "significant": bool(p_val < 0.05),
        "df_between": df_between,
        "df_within": df_within,
        "partial_eta_squared": round(float(partial_eta2), 4),
        "cohens_f": round(_cohens_f(groups), 4),
        "levene": {"stat": round(float(levene_stat), 4), "p": round(float(levene_p), 4)},
        "shapiro": shapiro,
        "group_means": {s: round(float(data[data.strategy == s][kpi].mean()), 3)
                        for s in config.STRATEGIES},
    }


def tukey_hsd(df: pd.DataFrame, kpi: str = "TET", flood_level: str | None = None) -> dict[str, Any]:
    """Tukey HSD post-hoc across strategies (alpha = 0.05)."""
    data = df if flood_level is None else df[df.flood_level == flood_level]
    try:
        from statsmodels.stats.multicomp import pairwise_tukeyhsd

        res = pairwise_tukeyhsd(endog=data[kpi].to_numpy(),
                                groups=data["strategy"].to_numpy(), alpha=0.05)
        comparisons = []
        for row in res.summary().data[1:]:
            comparisons.append({
                "group1": row[0], "group2": row[1], "meandiff": float(row[2]),
                "p_adj": float(row[3]), "lower": float(row[4]), "upper": float(row[5]),
                "reject": bool(row[6]),
            })
        return {"kpi": kpi, "flood_level": flood_level or "all", "comparisons": comparisons}
    except Exception as exc:  # statsmodels optional
        return {"kpi": kpi, "flood_level": flood_level or "all", "error": str(exc)}


def full_statistics(df: pd.DataFrame) -> dict[str, Any]:
    out: dict[str, Any] = {"anova": {}, "tukey": {}}
    for kpi in ["TET", "AET", "ECR", "EI"]:
        out["anova"][kpi] = {}
        out["tukey"][kpi] = {}
        for flood in config.FLOOD_LEVELS:
            out["anova"][kpi][flood] = anova_by_strategy(df, kpi, flood)
            out["tukey"][kpi][flood] = tukey_hsd(df, kpi, flood)
    return out
