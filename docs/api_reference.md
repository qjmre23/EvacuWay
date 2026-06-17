# EvacuWay — API Reference (Task 10)

Base URL: `http://localhost:8000`. No authentication. Interactive docs at `/docs` (Swagger) and
`/redoc`. All responses are JSON.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/api/meta` | Project metadata, bounding box, dataset stats, graph summary |
| GET | `/api/scenarios` | All strategy × flood-level combinations |
| POST | `/api/simulate` | Run a simulation; returns six KPIs + routes |
| POST | `/api/routes` | Route geometry for a given run |
| GET | `/api/network` | Graph summary (nodes, edges, bounds) |
| GET | `/api/kpis` | KPI summary for a scenario |
| GET | `/api/results/{run_id}` | Full stored run result |
| GET | `/api/centers` | Evacuation centers with coordinates |
| GET | `/api/origins` | Origin zones with population |
| GET | `/api/flood-points` | Flood-risk points (map heat layer) |
| GET | `/api/summary` | Aggregated 270-run Table-4 cells |

---

### GET /health
```bash
curl http://localhost:8000/health
```
```json
{ "status": "ok" }
```

### GET /api/meta
```bash
curl http://localhost:8000/api/meta
```
Returns `study_area`, `bbox`, `strategies`, `flood_levels`, `kpis`, `seeds`, `dataset_stats`,
`graph`, `ncr_lgus`, `csv_missing_lgus`.

### GET /api/scenarios
```bash
curl http://localhost:8000/api/scenarios
```
```json
{ "scenarios": [ { "id": "A_mild", "strategy": "A", "flood_level": "mild", "lambda_f": 0.33 }, "…(9)" ], "count": 9 }
```

### POST /api/simulate
**Request body:**
```json
{ "strategy": "B", "flood_level": "severe", "seed": 42, "city_subset": null, "include_routes": true }
```
**Response (abridged):**
```json
{
  "run_id": "B_severe_42",
  "strategy": "B", "flood_level": "severe", "seed": 42,
  "kpis": { "TET": 429.3, "AET": 30.7, "ECR": 88.0, "NUI": 1.358, "EI": 0.531, "SCP": 90.2 },
  "closed_edges": 664, "total_agents": 187985, "completed_agents": 165400,
  "routes": [ { "origin": "N001", "destination": "N742", "population": 500, "coords": [[14.65,121.09], "…"] } ],
  "meta": { "origins": 381, "centers": 129, "edges_after_flood": 2400 }
}
```
```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"strategy":"B","flood_level":"severe","seed":42,"include_routes":true}'
```

### POST /api/routes
```bash
curl -X POST http://localhost:8000/api/routes \
  -H "Content-Type: application/json" \
  -d '{"strategy":"C","flood_level":"moderate","seed":42}'
```
Returns `{ "run_id": "...", "routes": [ ... ] }`.

### GET /api/kpis
```bash
curl "http://localhost:8000/api/kpis?strategy=A&flood_level=mild&seed=42"
```
```json
{ "run_id": "A_mild_42", "kpis": { "TET": "...", "AET": "...", "ECR": "...", "NUI": "...", "EI": "...", "SCP": "..." } }
```

### GET /api/network
```bash
curl http://localhost:8000/api/network
```
Returns `prototype_nodes`, `prototype_edges`, `origin_zones`, `evacuation_centers`, `intersections`,
`total_population`, `bbox`, and a note about the full OSMnx scale.

### GET /api/results/{run_id}
```bash
curl http://localhost:8000/api/results/B_severe_42
```
Returns the full stored run JSON (404 if not yet run).

### GET /api/centers · /api/origins · /api/flood-points
```bash
curl http://localhost:8000/api/centers
curl http://localhost:8000/api/origins
curl http://localhost:8000/api/flood-points
```

### GET /api/summary
```bash
curl http://localhost:8000/api/summary
```
Returns `{ "cells": [ { "strategy", "flood_level", "n", "TET", "AET", "ECR", "NUI", "EI", "SCP", ... } ], "n_runs": 270, "kpis": [...] }`
(404 until `scripts/run_experiment.py` has been run).

## Error model
- `422` — invalid strategy/flood level (validation).
- `404` — unknown `run_id` or missing experiment summary.
