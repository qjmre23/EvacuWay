# EvacuWay — Revised Scope (Task 3)

## Study area
**Whole Metro Manila (National Capital Region), all 17 LGUs:** Caloocan, Las Piñas, Makati,
Mandaluyong, Manila, Marikina, Muntinlupa, Navotas, Parañaque, Pasay, Pasig, Pateros, Quezon City,
San Juan, Taguig, Valenzuela. *(The Marikina sub-network appears only as a labelled prototype seed —
see [revised_study_area.md](revised_study_area.md).)*

## Data sources
- **OpenStreetMap** (road network, via OSMnx / Overpass).
- **NAMRIA** (elevation / topographic reference).
- **PAGASA** (typhoon signal levels → severity multiplier λF).
- **PSA 2020 census** (barangay population for origin-zone loads).
- **DSWD / DepEd** (registered evacuation centers).
- `metro_manila_flood_dataset.csv` (flood susceptibility, population loads, historical centers,
  response-time benchmarks) and `Evacuation_Marikina_Dataset.xlsx` (prototype graph seed).

## Routing strategies (three)
- **Strategy A — Dijkstra shortest-path** (decentralised; each origin to nearest center).
- **Strategy B — Frank-Wolfe capacity-aware** (centralised; BPR load balancing).
- **Strategy C — Zone-Sequential priority** (phased departures by flood risk).

## Flood-severity levels (three)
| Level | Severity multiplier λF |
|-------|------------------------|
| Mild | 0.33 |
| Moderate | 0.66 |
| Severe | 1.00 |

## Experiment
- **270 fully reproducible runs** = 3 strategies × 3 flood levels × 30 fixed seeds (42–71).
- Deterministic per seed; identical results on re-run.

## Key performance indicators (six)
TET (Total Evacuation Time), AET (Average Evacuation Time), ECR (Evacuation Completion Rate),
NUI (Network Utilization Index), EI (Equity Index / Gini), SCP (Survival Completion Percentage).
Full definitions in [revised_results_analysis.md](revised_results_analysis.md).

## Road network
- Production runs use the **OSMnx-extracted Metro Manila drive graph**.
- The 1,250-node Marikina XLSX is a **prototype seed** used for pipeline validation only
  (see [network_scale.md](network_scale.md)).

## Explicitly in scope
Comparative routing-strategy evaluation; progressive road failure (Bernoulli closures + flood
slowdown); equity measurement; statistical testing of strategy differences.

## Explicitly out of scope
Fluid-dynamics flood modelling; multi-modal transport; behavioural non-compliance; intra-day weather
nowcasting. See [revised_delimitation.md](revised_delimitation.md).
