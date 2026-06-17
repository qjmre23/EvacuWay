# EvacuWay — Setup Guide (Task 10)

A new developer should be able to run the full system in **under 15 minutes**.

## Prerequisites
- Python **3.11+** (tested on 3.14)
- Node.js **18+** (tested on 24) and npm
- Git

## Backend

```bash
cd backend
python -m venv venv
# Windows (PowerShell):
. venv/Scripts/Activate.ps1
# Windows (git-bash):  . venv/Scripts/activate
# macOS / Linux:       source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env            # optional; sensible defaults work out of the box

# Start the API (from the backend/ directory):
uvicorn main:app --reload --port 8000
# ...or from the repo root:
#   uvicorn backend.main:app --reload --port 8000
```

Verify: open <http://localhost:8000/health> → `{"status":"ok"}` and <http://localhost:8000/docs> for
the interactive Swagger UI.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev
# Open http://localhost:5173
```

No login is required. If the backend is not running, the dashboard automatically uses the bundled
sample data in `frontend/public/`.

## Run the full experiment (optional)

```bash
# from the repo root, with the backend venv active (or any env with the deps)
python scripts/run_experiment.py
```

This executes all **270 runs** (~1 minute), writes one JSON per run plus `summary.json`,
`statistics.json`, and `all_runs.csv` to `data/results/`, and refreshes the dashboard's bundled data.

## Regenerate the full Metro Manila OSMnx graph (optional, production)

```bash
pip install -r backend/requirements-geo.txt   # osmnx, geopandas, shapely, mesa
python scripts/extract_osmnx_graph.py --sample 10000
```

## Consistency check (Task 10 QA)

```bash
python scripts/consistency_check.py
# asserts: zero LIAR/PolitiFact/NLP refs, no "150-500 nodes", no unqualified "Marikina"
```

## Troubleshooting
- **`openpyxl` ImportError:** `pip install openpyxl` (already in `requirements.txt`).
- **CORS error in browser:** ensure `CORS_ORIGINS` in `backend/.env` includes your frontend origin
  (defaults cover 5173/3000).
- **Port in use:** change `--port` (backend) or Vite's port in `frontend/vite.config.ts`.
- **OSMnx/GeoPandas won't install:** they are **optional** (`requirements-geo.txt`); the prototype
  simulation and smoke test do not need them.
