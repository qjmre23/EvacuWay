"""
EvacuWay — FastAPI application entry point.

Run with:  uvicorn backend.main:app --reload --port 8000
(or, from inside the backend/ directory:  uvicorn main:app --reload --port 8000)

No authentication is required — the API and dashboard are fully open for the thesis
demonstration.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:  # allow both "uvicorn backend.main:app" and "uvicorn main:app"
    from . import config
    from .routes import router
except ImportError:  # pragma: no cover - direct module execution
    import config
    from routes import router

app = FastAPI(
    title="EvacuWay API",
    description=("Metro Manila typhoon evacuation routing simulation — comparative "
                 "evaluation of three routing strategies under progressive flood severity."),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "name": "EvacuWay API",
        "study_area": "Metro Manila (NCR)",
        "docs": "/docs",
        "health": "/health",
        "api": "/api/meta",
    }
