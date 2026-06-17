"""EvacuWay — Pydantic request/response models for the REST API."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    strategy: str = Field(..., description="Routing strategy: A | B | C")
    flood_level: str = Field(..., description="mild | moderate | severe")
    seed: int = Field(42, description="RNG seed for reproducibility")
    city_subset: Optional[list[str]] = Field(
        None, description="Optional barangay/city filter; null = whole network")
    include_routes: bool = Field(True, description="Return route geometry for the map")


class KPIs(BaseModel):
    TET: float
    AET: float
    ECR: float
    NUI: float
    EI: float
    SCP: float


class SimulateResponse(BaseModel):
    run_id: str
    strategy: str
    flood_level: str
    seed: int
    kpis: KPIs
    closed_edges: int
    total_agents: int
    completed_agents: int
    routes: list[dict[str, Any]] = []
    meta: dict[str, Any] = {}


class RoutesRequest(BaseModel):
    strategy: str
    flood_level: str
    seed: int = 42


class HealthResponse(BaseModel):
    status: str
