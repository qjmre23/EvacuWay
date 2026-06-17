# EvacuWay — Revised Objectives (Task 3)

## General objective
To develop a reproducible simulation that **comparatively evaluates three evacuation-routing
strategies** across **Metro Manila (NCR)** under progressively severe typhoon-induced flooding, and to
translate the results into actionable evacuation-routing guidance for Philippine LGUs.

## Specific objectives
1. **Construct the network.** Build the Metro Manila road-network graph from OpenStreetMap via OSMnx,
   seeded and validated against the 1,250-node Marikina prototype sub-network, and annotate edges with
   flood susceptibility (fe) derived from `metro_manila_flood_dataset.csv`.
2. **Implement three routing strategies:**
   - A — Dijkstra shortest-path (decentralised),
   - B — Frank-Wolfe capacity-aware (centralised, BPR),
   - C — Zone-Sequential priority (phased by flood risk).
3. **Model progressive road failure** using a probabilistic Bernoulli edge-failure engine driven by
   three severity levels (Mild λF = 0.33, Moderate λF = 0.66, Severe λF = 1.0), plus slowdown on
   surviving flooded roads.
4. **Measure six KPIs** — TET, AET, ECR, NUI, EI (Gini), SCP — over **270 reproducible runs**
   (3 × 3 × 30 seeds).
5. **Test differences statistically** with one-way ANOVA across strategies (per KPI, per flood level),
   Tukey HSD post-hoc, and effect sizes (Cohen's f, partial η²).
6. **Analyse equity** explicitly, reporting the Gini coefficient of individual clearance times by
   strategy × flood level.
7. **Produce policy guidance** mapping PAGASA typhoon signal to the recommended routing strategy for
   LGUs and the NDRRMC.

All seven objectives use **three** strategies and the **Metro Manila** study area — consistent with
[revised_scope.md](revised_scope.md) and [revised_delimitation.md](revised_delimitation.md).
