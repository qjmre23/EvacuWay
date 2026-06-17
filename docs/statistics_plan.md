# EvacuWay — Statistical Analysis Plan (Task 9)

Pre-registered analysis applied to the 270-run experiment. Implemented in `backend/analysis.py`;
executed by `scripts/run_experiment.py`; output in `data/results/statistics.json`.

## Design
- **Factor:** routing strategy (3 levels: A, B, C).
- **Blocking variable:** flood level (Mild / Moderate / Severe) — analysed separately per level.
- **Replication:** 30 random seeds (42–71) per cell → n = 30.
- **Dependent variables:** TET, AET, ECR, EI (primary); NUI, SCP (secondary).

## Inferential tests
1. **One-way ANOVA** across strategies, per KPI, per flood level. Reports F, p, df_between = 2,
   df_within = 87.
2. **Post-hoc:** **Tukey HSD** at α = 0.05 for all pairwise strategy comparisons (A-B, A-C, B-C).
3. **Effect size:** **Cohen's f** and **partial η²** for each KPI.

## Assumption checks
- **Normality:** Shapiro-Wilk per cell (n = 30) — reported per strategy.
- **Homogeneity of variance:** Levene's test across strategies.
- Where assumptions are violated, results are interpreted with the robustness of ANOVA to moderate
  departures at n = 30 in mind; a non-parametric Kruskal-Wallis cross-check is available via SciPy if
  required.

## Reporting standard
For each ANOVA: **F-statistic, p-value, df, partial η², Cohen's f, group means**, plus Levene and
Shapiro diagnostics. For each Tukey comparison: **mean difference, adjusted p, 95 % CI, reject/accept**.

## Reproducibility
Fixed seed list guarantees identical results on re-run. `python scripts/run_experiment.py` regenerates
every per-run JSON, the aggregate `summary.json`, and `statistics.json` from scratch.

## Headline results (executed)
- TET, AET, EI: **significant** strategy effect at every flood level (all p < 0.05).
- Largest effects: AET (Cohen's f = 2.66 Mild, 1.40 Severe) and EI (f = 0.83 Mild, 1.27 Severe).
- Tukey: B fastest (TET/AET) and C most equitable (EI) — pairwise differences significant where
  effect sizes are large.
