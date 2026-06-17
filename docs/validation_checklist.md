# EvacuWay — Validation / Smoke-Test Checklist (Task 10)

Status as verified during the rebuild (2026-06-17).

| # | Check | Status |
|---|-------|:------:|
| 1 | Backend `/health` returns 200 `{"status":"ok"}` | ✅ verified |
| 2 | `POST /api/simulate` returns all six KPI values | ✅ verified (e.g. B/severe → TET/AET/ECR/NUI/EI/SCP) |
| 3 | Frontend map renders Metro Manila tiles | ✅ verified (OSM tiles 200; 729 map paths) |
| 4 | Strategy selector triggers an API call | ✅ verified (`POST /api/simulate` 200 from UI) |
| 5 | KPI cards update after simulation | ✅ verified (UI showed `C_moderate_42 (api)` with all 6 KPIs) |
| 6 | Flood-severity toggle changes simulation output | ✅ verified (KPIs differ by level) |
| 7 | Mobile layout renders without horizontal scroll | ✅ verified (responsive tabs Map/Controls/Results) |
| 8 | No console errors in the browser | ✅ verified (only React DevTools info + Vite debug) |
| 9 | All 270-run batch completes successfully | ✅ verified (270 runs in ~57 s; 272 JSON files) |
| 10 | Zero LIAR references in any file | ✅ verified (`scripts/consistency_check.py`) |
| 11 | No "150–500 nodes" anywhere | ✅ verified |
| 12 | No unqualified "Marikina" scope | ✅ verified (qualified as prototype/sample/seed/XLSX) |
| 13 | Three strategies everywhere | ✅ verified |
| 14 | No hardcoded secrets/API keys | ✅ verified (keys only via `.env`, gitignored) |
| 15 | App runs without login | ✅ verified (no auth anywhere) |
| 16 | ANOVA significant for strategy effect | ✅ verified (TET/AET/EI p < 0.05 all levels) |
| 17 | Frontend builds (`npm run build`) | ✅ verified (931 modules, no TS errors) |

## How to re-run the smoke test

```bash
# backend
cd backend && uvicorn main:app --port 8000 &
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/simulate -H "Content-Type: application/json" \
  -d '{"strategy":"B","flood_level":"severe","seed":42}'

# experiment + consistency
python scripts/run_experiment.py
python scripts/consistency_check.py

# frontend
cd frontend && npm install && npm run build && npm run dev
# open http://localhost:5173
```
