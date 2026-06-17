"""
EvacuWay — OPTIONAL production graph extraction from OpenStreetMap via OSMnx.

This replaces the bundled Marikina prototype graph with the full Metro Manila
(NCR) drive network. Requires the optional geospatial stack:

    pip install -r backend/requirements-geo.txt

Pipeline (documented in docs/network_scale.md):
  1. graph_from_place("Metro Manila, Philippines", network_type="drive")
  2. serialise to data/metro_manila_graph.graphml (cache locally)
  3. spatial-join flood susceptibility (fe) from the CSV onto each edge
  4. snap evacuation centres and origin-zone populations onto graph nodes
  5. export node/edge tables to data/nodes.csv and data/edges.csv

Usage:
    python scripts/extract_osmnx_graph.py --sample 10000
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend import config  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--place", default=config.METRO_MANILA_PLACE)
    ap.add_argument("--sample", type=int, default=0,
                    help="optional stratified node sample size (0 = full graph)")
    args = ap.parse_args()

    try:
        import osmnx as ox
    except ImportError:
        print("OSMnx is not installed. Install the optional geospatial stack:")
        print("    pip install -r backend/requirements-geo.txt")
        sys.exit(1)

    print(f"Extracting drive network for: {args.place}")
    G = ox.graph_from_place(args.place, network_type="drive")
    print(f"  nodes={G.number_of_nodes()}  edges={G.number_of_edges()}")

    config.GRAPH_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    ox.save_graphml(G, config.GRAPH_CACHE_PATH)
    print(f"  cached -> {config.GRAPH_CACHE_PATH}")

    nodes, edges = ox.graph_to_gdfs(G)
    nodes.to_csv(config.DATA_DIR / "nodes.csv")
    edges.to_csv(config.DATA_DIR / "edges.csv")
    print(f"  exported node/edge tables to {config.DATA_DIR}")
    print("Next: assign fe per edge (spatial join with the flood CSV) and snap "
          "centres/origins — see docs/network_scale.md step 3-5.")


if __name__ == "__main__":
    main()
