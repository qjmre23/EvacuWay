# EvacuWay — Deployment Notes (Task 10)

## Option A — Docker Compose (backend + frontend)

`docker-compose.yml` (reference):

```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - CORS_ORIGINS=http://localhost:4173,http://localhost:5173
    volumes:
      - ./data:/app/data
  frontend:
    build: ./frontend
    ports: ["4173:4173"]
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on: [backend]
```

`backend/Dockerfile` (reference):
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend
COPY data/ ./data
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`frontend/Dockerfile` (reference):
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
```

## Option B — Static frontend + hosted API
Build the frontend (`npm run build`) and host `frontend/dist/` on any static host (Netlify, Vercel,
GitHub Pages). Set `VITE_API_URL` at build time to the deployed API URL. Because the dashboard bundles
sample data, a **static-only** deploy still renders fully (the 9 scenarios, the map, the Table-4
charts) — live custom runs require the API.

## Environment variables
| Variable | Where | Default |
|----------|-------|---------|
| `CORS_ORIGINS` | backend | localhost:3000/5173/127.0.0.1:5173 |
| `DATA_CSV_PATH`, `DATA_XLSX_PATH`, `RESULTS_DIR`, `GRAPH_CACHE_PATH` | backend | `data/...` |
| `AGENT_SPEED_KMH`, `EVAC_WINDOW_MIN`, `DEMAND_SCALE`, … | backend | see `config.py` |
| `VITE_API_URL` | frontend | `http://localhost:8000` |
| `PAGASA_API_KEY`, `OPENTOPOGRAPHY_API_KEY` | backend `.env` only | unset |

**Never hardcode keys; never commit `.env`** (it is gitignored).

## OSMnx graph cache
Generate once and ship as a volume/artifact:
```bash
pip install -r backend/requirements-geo.txt
python scripts/extract_osmnx_graph.py
# produces data/metro_manila_graph.graphml (cached; avoids repeated Overpass calls)
```

## CI/CD sketch (GitHub Actions)
```yaml
name: ci
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r backend/requirements.txt
      - run: python scripts/consistency_check.py
      - run: python -c "from backend.simulation import get_simulator; print(get_simulator().run('B','severe',42).kpis)"
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: cd frontend && npm ci && npm run build
```
