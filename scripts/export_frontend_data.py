"""
Export static fallback data so the dashboard renders even when the API is offline.

Writes:
  frontend/public/network_data.json  — centers, origins, flood points (map layers)
  frontend/public/sample_routes.json — routes + KPIs for all 9 scenarios (seed 42)

Usage:  python scripts/export_frontend_data.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend import config, data_loader  # noqa: E402
from backend.simulation import get_simulator  # noqa: E402


def main() -> None:
    public = ROOT / "frontend" / "public"
    public.mkdir(parents=True, exist_ok=True)

    network = {
        "centers": data_loader.centers_payload(),
        "origins": data_loader.origins_payload(),
        "floodPoints": data_loader.flood_points_payload(limit=600),
        "bbox": config.METRO_MANILA_BBOX,
        "graph": data_loader.graph_summary(),
        "meta": {
            "study_area": "Metro Manila (NCR), all 17 LGUs",
            "ncr_lgus": config.NCR_LGUS,
            "csv_missing_lgus": config.CSV_MISSING_LGUS,
        },
    }
    (public / "network_data.json").write_text(json.dumps(network), encoding="utf-8")
    print(f"network_data.json: {len(network['centers'])} centers, "
          f"{len(network['origins'])} origins, {len(network['floodPoints'])} flood points")

    sim = get_simulator()
    routes = {}
    for strat in config.STRATEGIES:
        for flood in config.FLOOD_LEVELS:
            res = sim.run(strat, flood, 42, include_routes=True)
            routes[f"{strat}_{flood}"] = {
                "kpis": res.kpis,
                "closed_edges": res.closed_edges,
                "total_agents": res.total_agents,
                "completed_agents": res.completed_agents,
                "routes": res.routes,
            }
    (public / "sample_routes.json").write_text(json.dumps(routes), encoding="utf-8")
    print(f"sample_routes.json: {len(routes)} scenarios")


if __name__ == "__main__":
    main()
