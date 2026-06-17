# EvacuWay

## Project Overview

EvacuWay is a comparative simulation project that evaluates evacuation strategy effectiveness under typhoon and flood conditions in Metro Manila (NCR). It compares three routing strategies (Dijkstra, Frank-Wolfe, and Zone-Sequential) across varying flood severities and reports KPIs like Total Evacuation Time (TET) and equity measures.

## Architecture

- **Frontend**: React + Vite + TypeScript dashboard (`frontend/`), served on port 5000
- **Backend**: FastAPI simulation engine (`backend/`), served on port 8000
- **Data**: CSV/XLSX datasets and simulation results (`data/`)
- **Scripts**: Experiment runners and data processing utilities (`scripts/`)

## Running the Project

Both services run automatically via Replit workflows:

- **Start application** — Vite dev server on port 5000 (frontend)
- **Backend API** — Uvicorn FastAPI server on port 8000 (backend)

## Key Configuration

- Vite config: `frontend/vite.config.ts` — uses port 5000, allows all hosts for Replit proxy
- Backend CORS: `backend/config.py` — allows all origins by default
- Backend entry point: `uvicorn backend.main:app` (run from project root)

## User Preferences

- None recorded yet
