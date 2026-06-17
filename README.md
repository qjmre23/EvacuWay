# EvacuWay

**Comparative Simulation of Evacuation Strategy Effectiveness Under Typhoon and Flood Emergency
Conditions in Metro Manila**

EvacuWay is a reproducible evacuation-routing simulation with a live interactive web dashboard. It
compares **three routing strategies** under **progressive flood severity** across **Metro Manila
(NCR)**, and reports six performance indicators including an explicit **equity** measure.

> This is an evacuation-routing simulation study. It contains **no** machine-learning,
> text-classification, or fake-news content.

## Study scope
- **Study area:** Metro Manila (National Capital Region), **all 17 LGUs**.
- **Prototype seed:** the 1,250-node *Marikina sub-network* (`Evacuation_Marikina_Dataset.xlsx`) —
  used for pipeline validation only. Full runs use an **OSMnx-extracted Metro Manila** drive graph.

## Three routing strategies
- **A — Dijkstra shortest-path** (decentralised).
- **B — Frank-Wolfe capacity-aware** (centralised, BPR load balancing).
- **C — Zone-Sequential priority** (phased departures by flood risk).

## Three flood-severity levels
Mild (λF = 0.33) · Moderate (λF = 0.66) · Severe (λF = 1.0), applied via a probabilistic Bernoulli
edge-failure engine + flood slowdown.

## Six KPIs
TET · AET · ECR · NUI · EI (Gini equity) · SCP — measured over **270 reproducible runs**
(3 strategies × 3 flood levels × 30 seeds).

## Datasets
- `data/metro_manila_flood_dataset.csv` — 2,200 flood-incident records, 27 columns, 12 NCR cities,
  2000–2024 (DSWD / PAGASA / NDRRMC).
- `data/Evacuation_Marikina_Dataset.xlsx` — 1,250-node Marikina prototype sub-network, 10 columns.

See [docs/data_dictionary.md](docs/data_dictionary.md) and
[docs/dataset_mapping_table.md](docs/dataset_mapping_table.md).

## Quick start (5 steps)

```bash
# 1. Clone
git clone https://github.com/qjmre23/EvacuWay.git && cd EvacuWay

# 2. Backend
cd backend && python -m venv venv && . venv/Scripts/activate   # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000        # API at http://localhost:8000  (docs at /docs)

# 3. (new terminal) Frontend
cd frontend && npm install
cp .env.example .env
npm run dev                                   # dashboard at http://localhost:5173

# 4. (optional) Run the full 270-run experiment
python scripts/run_experiment.py

# 5. Open the dashboard
#    http://localhost:5173  — no login required
```

> The dashboard works **even if the backend is not running**: it falls back to the bundled sample
> data in `frontend/public/`. With the backend up, it runs live simulations through `POST /api/simulate`.

> **Map routes follow real roads.** Drawn evacuation routes are snapped onto the OpenStreetMap drive
> network (Marikina), so every line follows streets instead of cutting across blocks — see
> [docs/road_following.md](docs/road_following.md). Open `frontend/public/route_verify.html` for an
> interactive A/B/C + flood + roads-vs-straight checker.

## No authentication
The API and dashboard are completely open — **no login, no auth, no API keys required**. Optional
external keys (PAGASA, OpenTopography) go in `.env` only and are never committed.

## Architecture
`CSV/XLSX → data_loader → simulation engine (A/B/C + Bernoulli) → FastAPI → React/Leaflet dashboard`.
Full diagram in [docs/architecture.md](docs/architecture.md).

## Results (headline)
Strategy **B** is fastest in every cell; Strategy **C** is the most equitable in every cell; Strategy
**A** is the naive baseline with the worst equity and steepest degradation. ANOVA confirms significant
strategy differences (p < 0.05). Full Table 4 and statistics in
[docs/revised_results_analysis.md](docs/revised_results_analysis.md).

## Documentation index
Audit ([docs/audit_report.md](docs/audit_report.md)) ·
Introduction ([docs/revised_introduction.md](docs/revised_introduction.md)) ·
Scope ([docs/revised_scope.md](docs/revised_scope.md)) ·
Objectives ([docs/revised_objectives.md](docs/revised_objectives.md)) ·
Delimitation ([docs/revised_delimitation.md](docs/revised_delimitation.md)) ·
Datasets ([docs/revised_dataset_description.md](docs/revised_dataset_description.md)) ·
Network scale ([docs/network_scale.md](docs/network_scale.md)) ·
Results ([docs/revised_results_analysis.md](docs/revised_results_analysis.md)) ·
Setup ([docs/setup.md](docs/setup.md)) ·
Road-following routes ([docs/road_following.md](docs/road_following.md)) ·
API ([docs/api_reference.md](docs/api_reference.md)) ·
Architecture ([docs/architecture.md](docs/architecture.md)) ·
Deployment ([docs/deployment.md](docs/deployment.md)) ·
Validation ([docs/validation_checklist.md](docs/validation_checklist.md)) ·
Assumptions ([docs/assumptions.md](docs/assumptions.md)).

## License
Academic / thesis use. Datasets © their respective Philippine government sources (DSWD, PAGASA, NDRRMC).
