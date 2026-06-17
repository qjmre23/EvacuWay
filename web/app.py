"""
web/app.py — production entry point for Replit deployment.

Wraps the existing EvacuWay FastAPI app and adds static file serving so
the React dashboard is served at the root URL while all /api/* and /health
routes continue to work normally.

Run with:
    uvicorn web.app:app --host 0.0.0.0 --port 5000
"""
from __future__ import annotations

import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.main import app  # noqa: re-export

DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

# ── Remove the API root info route so the SPA index.html takes over ────────
app.routes[:] = [r for r in app.routes
                 if not (getattr(r, "path", None) == "/" and
                         "GET" in getattr(r, "methods", set()))]

# ── Serve pre-built static assets (JS / CSS bundles) ───────────────────────
app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")


# ── SPA catch-all: known static files → serve directly, else → index.html ──
@app.get("/{full_path:path}", include_in_schema=False)
async def spa(full_path: str) -> FileResponse:
    candidate = os.path.join(DIST, full_path)
    if full_path and os.path.isfile(candidate):
        return FileResponse(candidate)
    return FileResponse(os.path.join(DIST, "index.html"))
