# EvacuWay — Figure Caption Pack (Task 9)

Captions for all thesis figures, corrected to Metro Manila scope and populated with real data.

- **Figure 1 — System architecture.** "Data flow from the flood CSV and Marikina prototype XLSX
  through the data loader and simulation engine to the FastAPI backend and React/Leaflet dashboard."
  (See [architecture.md](architecture.md).)

- **Figure 2 — Bernoulli flood-disruption engine.** "Per-edge closure probability fe·λF and the
  flood-slowdown of surviving roads, across the three severity levels (λF = 0.33 / 0.66 / 1.0)."

- **Figure 3 — Three routing strategies.** "Schematic of Strategy A (decentralised Dijkstra),
  Strategy B (Frank-Wolfe/BPR load balancing), and Strategy C (zone-sequential phased departures)."

- **Figure 4 — Study area.** "Road network and flood-risk overlay for **Metro Manila (NCR), 17 LGUs**
  (bounding box 14.35–14.78 N, 120.90–121.20 E). Marikina prototype sub-network shown as the
  validation seed." (Live: the dashboard map.)

- **Figure 5 — Evacuation centers and origin zones.** "129 evacuation centers (green) and 381
  populated origin barangays (orange) of the prototype network across **Metro Manila**; full runs use
  ~300–500 DSWD/DepEd centers and ~2,000–5,000 origin zones."

- **Figure 6 — Equity (Gini) heatmap.** "Equity Index (Gini of clearance times) over the 3 × 3
  strategy × flood grid. Ordering C < B < A at every severity; Gini rises with severity. Data:
  `data/results/summary.json`." **Real values:**

  | | Mild | Moderate | Severe |
  |---|---|---|---|
  | A | 0.505 | 0.555 | 0.602 |
  | B | 0.423 | 0.514 | 0.587 |
  | C | 0.405 | 0.448 | 0.487 |

- **Figure 7 — TET by strategy and flood level (bar chart).** "Mean Total Evacuation Time (270-run
  mean). Strategy B lowest at every severity." (Live: dashboard Results panel.) Values (min):

  | | Mild | Moderate | Severe |
  |---|---|---|---|
  | A | 245.6 | 318.2 | 418.7 |
  | B | 157.0 | 246.9 | 363.7 |
  | C | 263.9 | 347.8 | 435.5 |

- **Figure 8 — Completion rate vs flood severity (line chart).** "ECR declines from ~98 % (Mild) to
  ~91 % (Severe) for all strategies." (Live: dashboard Results panel.)

All figures are reproducible from `data/results/` after running `scripts/run_experiment.py`.
