"""EvacuWay — REST API route handlers."""
from __future__ import annotations

import json
from itertools import product

from fastapi import APIRouter, HTTPException

from . import config, data_loader
from .models import RoutesRequest, SimulateRequest, SimulateResponse
from .simulation import get_simulator

router = APIRouter()


# --------------------------------------------------------------------------- #
# Metadata & catalogue
# --------------------------------------------------------------------------- #
@router.get("/meta")
def get_meta():
    return {
        "project": "EvacuWay",
        "title": ("Comparative Simulation of Evacuation Strategy Effectiveness Under "
                  "Typhoon and Flood Emergency Conditions in Metro Manila"),
        "study_area": "Metro Manila (NCR), all 17 LGUs",
        "bbox": config.METRO_MANILA_BBOX,
        "strategies": {
            "A": "Dijkstra shortest-path (decentralised)",
            "B": "Frank-Wolfe capacity-aware (centralised)",
            "C": "Zone-Sequential priority (phased)",
        },
        "flood_levels": {k: config.LAMBDA_F[k] for k in config.FLOOD_LEVELS},
        "kpis": ["TET", "AET", "ECR", "NUI", "EI", "SCP"],
        "seeds": config.SEEDS,
        "dataset_stats": data_loader.dataset_stats(),
        "graph": data_loader.graph_summary(),
        "ncr_lgus": config.NCR_LGUS,
        "csv_missing_lgus": config.CSV_MISSING_LGUS,
    }


@router.get("/scenarios")
def get_scenarios():
    scenarios = []
    for strat, flood in product(config.STRATEGIES, config.FLOOD_LEVELS):
        scenarios.append({
            "id": f"{strat}_{flood}",
            "strategy": strat,
            "flood_level": flood,
            "lambda_f": config.LAMBDA_F[flood],
        })
    return {"scenarios": scenarios, "count": len(scenarios)}


@router.get("/network")
def get_network():
    return data_loader.graph_summary()


@router.get("/centers")
def get_centers():
    return {"centers": data_loader.centers_payload()}


@router.get("/origins")
def get_origins():
    return {"origins": data_loader.origins_payload()}


@router.get("/flood-points")
def get_flood_points():
    return {"points": data_loader.flood_points_payload()}


@router.get("/rainfall")
def get_rainfall():
    """Live PAGASA automatic-weather-station rainfall (best-effort, never errors)."""
    from . import rainfall
    return rainfall.get_rainfall()


# --------------------------------------------------------------------------- #
# Simulation
# --------------------------------------------------------------------------- #
@router.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    try:
        res = get_simulator().run(
            strategy=req.strategy, flood_level=req.flood_level, seed=req.seed,
            city_subset=req.city_subset, include_routes=req.include_routes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    # persist
    (config.RESULTS_DIR / f"{res.run_id}.json").write_text(
        json.dumps(res.to_dict(), indent=2), encoding="utf-8")
    return res.to_dict()


@router.post("/routes")
def routes(req: RoutesRequest):
    res = get_simulator().run(req.strategy, req.flood_level, req.seed, include_routes=True)
    return {"run_id": res.run_id, "routes": res.routes}


@router.get("/kpis")
def kpis(strategy: str, flood_level: str, seed: int = 42):
    res = get_simulator().run(strategy, flood_level, seed, include_routes=False)
    return {"run_id": res.run_id, "kpis": res.kpis}


@router.get("/results/{run_id}")
def get_result(run_id: str):
    path = config.RESULTS_DIR / f"{run_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"run {run_id} not found")
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/summary")
def get_summary():
    """Aggregated Table-4 cells from the stored 270-run experiment, if available."""
    path = config.RESULTS_DIR / "summary.json"
    if not path.exists():
        raise HTTPException(status_code=404,
                            detail="No experiment summary yet. Run scripts/run_experiment.py")
    return json.loads(path.read_text(encoding="utf-8"))
