# EvacuWay — Architecture (Task 10)

## Data flow

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│  metro_manila_flood.csv │     │ Evacuation_Marikina_*.xlsx   │
│  (2,200 incidents, 27c) │     │ (1,250 nodes, prototype seed)│
└────────────┬────────────┘     └───────────────┬──────────────┘
             │                                   │
             ▼                                   ▼
        ┌───────────────────────────────────────────────┐
        │ backend/data_loader.py                         │
        │  • load CSV / XLSX (cached)                    │
        │  • build_graph(): k-NN proximity graph         │
        │  • fe per edge, capacity, centers, origins     │
        │  • [optional] OSMnx full Metro Manila graph    │
        └───────────────────────┬───────────────────────┘
                                 ▼
        ┌───────────────────────────────────────────────┐
        │ backend/simulation.py                          │
        │  • Bernoulli flood-closure engine (fe·λF)      │
        │  • Strategy A: Dijkstra (capacitated)          │
        │  • Strategy B: Frank-Wolfe / MSA (BPR)         │
        │  • Strategy C: zone-sequential phased waves    │
        │  • KPIs: TET, AET, ECR, NUI, EI, SCP           │
        └───────────────────────┬───────────────────────┘
                                 ▼
        ┌───────────────────────────────────────────────┐
        │ backend/analysis.py                            │
        │  • 270-run batch, JSON persistence             │
        │  • ANOVA + Tukey HSD + Cohen's f               │
        └───────────────────────┬───────────────────────┘
                                 ▼
        ┌───────────────────────────────────────────────┐
        │ backend/main.py + routes.py  (FastAPI, CORS)   │
        │  /health  /api/meta  /api/simulate  /api/...   │
        └───────────────────────┬───────────────────────┘
                                 │  REST/JSON (no auth)
                                 ▼
        ┌───────────────────────────────────────────────┐
        │ frontend/ (React + TS + Vite + Leaflet + Recharts)
        │  • MapView  • ScenarioPanel  • KpiCards        │
        │  • ResultsPanel  • Legend                      │
        │  • api/client.ts → live API OR bundled fallback│
        └───────────────────────────────────────────────┘
```

## Component boundaries
- **data_loader** — the only module that touches raw files; everything downstream uses the graph.
- **simulation** — pure computation; no I/O except via data_loader; deterministic per seed.
- **analysis** — batch + statistics; persistence to `data/results/`.
- **routes/main** — thin HTTP layer; no business logic.
- **frontend** — presentation only; never computes KPIs itself; degrades gracefully to bundled JSON.

## External dependencies (all keyless)
- OpenStreetMap tiles (basemap), OSMnx/Overpass (optional graph extraction), Nominatim (optional
  geocoding). See [deployment.md](deployment.md). Optional PAGASA/OpenTopography keys live in `.env`.

## Reproducibility & caching
- Graph build is memoised (`functools.lru_cache`); OSMnx graph cached to
  `data/metro_manila_graph.graphml`.
- Fixed seeds (42–71) → identical results on re-run.
