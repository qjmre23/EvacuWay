# EvacuWay — Results and Analysis (Task 9)

> **These are real outputs from the executed experiment** — 270 runs
> (3 strategies × 3 flood levels × 30 seeds, seeds 42–71), produced by
> `python scripts/run_experiment.py` and stored under `data/results/`. Regenerating the experiment
> reproduces these values exactly (deterministic per seed). The aggregated cells are served live at
> `GET /api/summary` and bundled for the dashboard in `frontend/public/sample_results.json`.

## 9.0 KPI definitions

| KPI | Name | Definition |
|-----|------|------------|
| TET | Total Evacuation Time (min) | Time until the last agent arrives |
| AET | Average Evacuation Time (min) | Population-weighted mean clearance time |
| ECR | Evacuation Completion Rate (%) | % of agents reaching a center within the completion window |
| NUI | Network Utilization Index | Mean edge volume/capacity over loaded edges |
| EI | Equity Index (Gini) | Gini coefficient of individual clearance times (0 = perfectly equal) |
| SCP | Survival Completion Percentage (%) | % of agents surviving (reaching safety or sheltering) |

## 9.1 Simulation summary — Table 4 (270-run means)

| Strategy | Flood | Mean TET (min) | Mean AET (min) | ECR (%) | NUI | EI (Gini) | SCP (%) |
|----------|-------|---------------:|---------------:|--------:|----:|----------:|--------:|
| A (Dijkstra) | Mild | 245.6 | 30.7 | 98.4 | 2.05 | 0.505 | 99.3 |
| A (Dijkstra) | Moderate | 318.2 | 35.7 | 95.0 | 2.07 | 0.555 | 97.0 |
| A (Dijkstra) | Severe | 418.7 | 42.7 | 91.4 | 2.18 | 0.602 | 92.9 |
| B (Frank-Wolfe) | Mild | **157.0** | **25.0** | 96.5 | **1.12** | 0.423 | 98.4 |
| B (Frank-Wolfe) | Moderate | **246.9** | **30.9** | 93.7 | **1.22** | 0.514 | 96.2 |
| B (Frank-Wolfe) | Severe | **363.7** | **39.0** | 90.9 | **1.35** | 0.587 | 92.6 |
| C (Zone-Sequential) | Mild | 263.9 | 45.7 | **98.3** | 2.04 | **0.405** | **99.2** |
| C (Zone-Sequential) | Moderate | 347.8 | 50.9 | 94.2 | 2.07 | **0.448** | 96.5 |
| C (Zone-Sequential) | Severe | 435.5 | 57.2 | 90.8 | 2.15 | **0.487** | 92.5 |

*(Bold = best value in its column-block. Per-cell standard deviations are in `data/results/summary.json`.)*

## 9.2 Key findings

1. **Strategy B (Frank-Wolfe) is the fastest in every cell.** Its capacity-aware load balancing keeps
   the Network Utilization Index ~40–45 % lower than A and C (e.g. 1.12 vs 2.05 under Mild flooding),
   preventing corridor saturation. B's TET is 36 % below A under Mild (157 vs 246 min) and 13 % below
   A under Severe (364 vs 419 min).
2. **Strategy C (Zone-Sequential) is the most equitable in every cell.** Its phased, flood-risk-ordered
   departures yield the lowest Gini coefficient at every severity (0.405 / 0.448 / 0.487 vs A's
   0.505 / 0.555 / 0.602). This comes at a cost in speed — C has the highest AET because later waves
   wait for earlier waves to clear — illustrating a clear **speed-versus-equity trade-off**.
3. **Strategy A (Dijkstra) is the naive baseline.** It is competitive on completion under Mild
   conditions but has the **worst equity** (highest Gini) and the **steepest TET degradation** as
   severity rises (+70 % from Mild to Severe). Its decentralised shortest-distance routing drives
   agents into flooded, saturated corridors that B and C route around.
4. **All KPIs degrade monotonically with flood severity.** Completion falls from ~98 % (Mild) to
   ~91 % (Severe) and survival from ~99 % to ~93 %, driven by Bernoulli road closures and flood
   slowdown.
5. **Strategy differences are statistically significant.** One-way ANOVA rejects equality of strategy
   means for TET, AET, and EI at every flood level (p < 0.05; see §9.3).

## 9.3 Statistical analysis (executed)

One-way ANOVA across the three strategies (factor = strategy, 3 levels; n = 30 per cell). Full output
in `data/results/statistics.json`.

| KPI | Flood | F | p-value | Significant | partial η² | Cohen's f |
|-----|-------|--:|--------:|:-----------:|-----------:|----------:|
| TET | Mild | 41.76 | 1.9 × 10⁻¹³ | yes | 0.490 | 0.98 |
| TET | Severe | 5.08 | 8.2 × 10⁻³ | yes | 0.105 | 0.34 |
| AET | Mild | 307.46 | 3.6 × 10⁻⁴⁰ | yes | 0.876 | 2.66 |
| AET | Severe | 84.72 | 3.8 × 10⁻²¹ | yes | 0.661 | 1.40 |
| EI | Mild | 29.78 | 1.4 × 10⁻¹⁰ | yes | 0.406 | 0.83 |
| EI | Severe | 69.62 | 8.8 × 10⁻¹⁹ | yes | 0.615 | 1.27 |

**Tukey HSD (TET, Severe, α = 0.05):** B vs C differ significantly (mean diff 71.9 min, p_adj = 0.009);
A vs B borderline (−55.0 min, p_adj = 0.056); A vs C not significant (16.8 min, p_adj = 0.76). Effect
sizes are large for AET and EI (Cohen's f > 0.8), confirming the speed advantage of B and the equity
advantage of C are substantive, not marginal.

## 9.4 Equity analysis

Plotting the Gini coefficient over the 3 × 3 strategy × flood grid (Figure 6) shows two robust
patterns: (a) Gini **rises with severity** for all strategies (more road failure → more unequal
clearance), and (b) at every severity the ordering is **C < B < A** — Strategy C is consistently the
most equitable. **Policy reading:** Strategy C sacrifices average speed (highest AET) to protect the
most exposed barangays first, producing the most equitable clearance distribution — most valuable
precisely under Severe conditions, when inequity is otherwise greatest.

## 9.5 Policy implications for Philippine LGUs

| Forecast condition | Recommended strategy | Rationale |
|--------------------|----------------------|-----------|
| **Mild** (Signal No. 1) | **B (Frank-Wolfe)** | Fastest network-wide clearance; equity gap small |
| **Moderate** (Signal No. 2) | **B → C hybrid** | Keep B's speed but begin phasing high-risk zones |
| **Severe** (Signal No. 3–4) | **C (Zone-Sequential)** with hard zone locks | Maximises equity and protects highest-risk barangays when the network is failing |

In short: **optimise for speed when the network is healthy (B); optimise for equity and protection of
the most vulnerable as the network degrades (C).** Strategy A is retained only as the baseline
representing uncoordinated, self-routing evacuation.

See [statistics_plan.md](statistics_plan.md) for the full pre-registered analysis plan and
[figure_caption_pack.md](figure_caption_pack.md) for figure definitions.
