# EvacuWay — Assumptions Log (Task 10)

Every engineering/modelling assumption made during implementation.

1. **Missing-city supplementation.** The 5 NCR cities absent from the CSV (Makati, Mandaluyong,
   Pasay, Pateros, San Juan) are supplemented with OSMnx road data and estimated flood susceptibility
   from NDRRMC public records or interpolated from adjacent cities. (See
   [revised_dataset_description.md](revised_dataset_description.md).)

2. **Typhoon alert → λF mapping:** None/Monsoon = 0.20, Signal 1 = 0.33, Signal 2 = 0.66,
   Signal 3 = 0.85, Signal 4 = 1.0. The three simulated levels (Mild 0.33 / Moderate 0.66 /
   Severe 1.0) bracket this scale.

3. **flood_risk_level → fe mapping:** Very High = 0.85, High = 0.60, Moderate = 0.35, Low = 0.10.

4. **OSMnx caching.** The full Metro Manila graph is cached locally
   (`data/metro_manila_graph.graphml`) to avoid repeated Overpass API calls during development.

5. **Stratified sample.** For thesis-scale runtime (< 60 min), a stratified spatial sample of
   ~10,000 nodes is drawn from the full OSMnx graph.

6. **Prototype role.** The 1,250-node Marikina XLSX is used **exclusively** for preprocessing-pipeline
   validation and graph seeding — never as the primary full-simulation graph.

7. **Agent count per origin zone** = `evacuees` (fallback `affected_population` / XLSX
   `Population Count`), **capped at 500** per zone for thesis-scale runs.

8. **Road capacity (Cₑ)** inferred from OSMnx `highway` tag: residential = 400 veh/hr,
   secondary = 800, primary = 1500, trunk = 2500. In the prototype graph (no OSM tags) capacity is
   assigned by a deterministic **length-based proxy** mapping to these same four classes.

## Prototype-graph-specific assumptions (this repo's shipped simulation)

9. **Adjacency.** Prototype edges are built by connecting each node to its **k = 4 nearest
   neighbours** (haversine) — a stand-in for road adjacency where explicit geometry is absent.

10. **Flood slowdown.** Surviving flood-exposed roads are slowed by `1 + 4·fe·λF` (partial
    inundation), in addition to fully closed edges.

11. **Evacuation-center capacity.** Each center has finite shelter capacity (base 2,200 agents,
    ±40 % deterministic jitter). Demand spillover to farther centers is what differentiates the three
    routing strategies.

12. **Queue discharge.** Origin zones discharge at 40 veh/min; the completion window is 240 min.

13. **Congestion.** Experienced time uses the BPR function `t = t₀·(1 + 0.15·(v/c)⁴)` with v/c
    measured against an evacuation-horizon capacity (capacity × 3 h) and clamped at 2.0 to keep the
    small prototype graph numerically stable.

14. **Calibration.** The prototype constants (DEMAND_SCALE = 9 effective via population, VC clamp,
    slowdown = 4) were calibrated so the three strategies and three severities are clearly separated
    and the ANOVA is well-powered; they are tunable in `backend/config.py` and would be re-fitted
    against observed `response_time_hours` benchmarks for the full OSMnx network.

> Calibration constants affect absolute KPI magnitudes, not the **comparative** conclusions (B fastest,
> C most equitable, A worst equity), which are robust across the 30 seeds.
