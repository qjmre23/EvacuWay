"""
EvacuWay — data loading, graph construction and caching.

This module turns the two ground-truth datasets into the in-memory road-network
graph used by the simulation engine:

* ``metro_manila_flood_dataset.csv`` — 2,200 flood-incident records (12 NCR
  cities, 2000-2024). Drives flood susceptibility, origin-zone population loads,
  evacuation-center seeds and KPI validation benchmarks.
* ``Evacuation_Marikina_Dataset.xlsx`` — 1,250-node Marikina **prototype seed**
  sub-network. Used here to build a runnable, fully offline prototype graph.

For full Metro-Manila runs the production pipeline replaces this prototype graph
with an OSMnx-extracted NCR ``drive`` network (see ``scripts/extract_osmnx_graph.py``
and ``docs/network_scale.md``). OSMnx / GeoPandas are therefore optional — the
prototype path below has no heavy geospatial dependencies and always runs.
"""
from __future__ import annotations

import math
from functools import lru_cache
from typing import Any

import networkx as nx
import pandas as pd

from . import config


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres."""
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _risk_to_fe(level: str) -> float:
    return config.RISK_TO_FE.get(str(level).strip().lower(), 0.35)


def _capacity_for_length(length_m: float) -> tuple[int, str]:
    """Deterministic prototype proxy: longer edges behave like higher road classes
    (arterials), shorter edges like residential streets. Mirrors Assumption #8."""
    if length_m >= 1200:
        return config.ROAD_CAPACITY["trunk"], "trunk"
    if length_m >= 700:
        return config.ROAD_CAPACITY["primary"], "primary"
    if length_m >= 350:
        return config.ROAD_CAPACITY["secondary"], "secondary"
    return config.ROAD_CAPACITY["residential"], "residential"


# --------------------------------------------------------------------------- #
# Raw dataset loaders
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=1)
def load_flood_csv() -> pd.DataFrame:
    df = pd.read_csv(config.DATA_CSV_PATH)
    return df


@lru_cache(maxsize=1)
def load_marikina_xlsx() -> pd.DataFrame:
    df = pd.read_excel(config.DATA_XLSX_PATH)
    df.columns = [str(c).strip() for c in df.columns]
    return df


def _node_risk(row: pd.Series) -> str:
    """The XLSX encodes the risk level inside the free-text ``Notes`` column
    (e.g. 'Low risk', 'Moderate risk', 'High risk'). Fall back gracefully."""
    notes = str(row.get("Notes", "")).lower()
    for level in ("very high", "high", "moderate", "low"):
        if level in notes:
            return level.title()
    return "Moderate"


# --------------------------------------------------------------------------- #
# Graph construction (prototype seed)
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=1)
def build_graph(k_neighbours: int = 4) -> nx.Graph:
    """Build the prototype road-network graph from the Marikina seed nodes.

    Each node is connected to its ``k`` nearest neighbours (k-NN proximity graph),
    a standard stand-in for road adjacency when explicit edge geometry is absent.
    Edge attributes: ``length`` (m), ``capacity`` (veh/hr), ``road_class`` and
    ``flood_susceptibility`` (fe = mean of endpoint susceptibilities).
    """
    df = load_marikina_xlsx().reset_index(drop=True)
    G = nx.Graph()

    coords: list[tuple[float, float]] = []
    for i, row in df.iterrows():
        nid = str(row["Node ID"])
        ntype = str(row["Node Type"]).strip()
        risk = _node_risk(row)
        is_center = str(row["Is Evacuation Center"]).strip().lower() == "yes"
        pop = int(row.get("Population Count", 0) or 0)
        lat = float(row["Centroid Latitude"])
        lon = float(row["Centroid Longitude"])
        coords.append((lat, lon))
        G.add_node(
            nid,
            node_type=ntype,
            barangay=str(row.get("Barangay Name", "")),
            population=min(pop, config.MAX_AGENTS_PER_ZONE) if ntype == "Origin Zone" else 0,
            raw_population=pop,
            elevation=float(row.get("Elevation (m asl)", 0) or 0),
            lat=lat,
            lon=lon,
            is_center=is_center,
            flood_risk=risk,
            fe=_risk_to_fe(risk),
            notes=str(row.get("Notes", "")),
        )

    ids = [str(r["Node ID"]) for _, r in df.iterrows()]

    # k-NN edges. O(n^2) over 1,250 nodes is fine (~1.5M dist ops, sub-second).
    for i, (lat1, lon1) in enumerate(coords):
        dists = []
        for j, (lat2, lon2) in enumerate(coords):
            if i == j:
                continue
            dists.append((_haversine_m(lat1, lon1, lat2, lon2), j))
        dists.sort(key=lambda t: t[0])
        for d, j in dists[:k_neighbours]:
            u, v = ids[i], ids[j]
            if G.has_edge(u, v):
                continue
            length = max(d, 25.0)
            cap, klass = _capacity_for_length(length)
            fe = (G.nodes[u]["fe"] + G.nodes[v]["fe"]) / 2.0
            G.add_edge(
                u, v,
                length=length,
                travel_time=length / config.AGENT_SPEED_M_PER_MIN,  # minutes (free flow)
                capacity=cap,
                road_class=klass,
                flood_susceptibility=round(fe, 4),
            )

    # Ensure the graph is connected so reachability is meaningful pre-flood.
    if not nx.is_connected(G):
        comps = list(nx.connected_components(G))
        comps.sort(key=len, reverse=True)
        main = comps[0]
        for comp in comps[1:]:
            # connect each isolated component to the nearest main-component node
            cnode = next(iter(comp))
            clat, clon = G.nodes[cnode]["lat"], G.nodes[cnode]["lon"]
            best = min(
                main,
                key=lambda m: _haversine_m(clat, clon, G.nodes[m]["lat"], G.nodes[m]["lon"]),
            )
            d = max(_haversine_m(clat, clon, G.nodes[best]["lat"], G.nodes[best]["lon"]), 25.0)
            cap, klass = _capacity_for_length(d)
            fe = (G.nodes[cnode]["fe"] + G.nodes[best]["fe"]) / 2.0
            G.add_edge(cnode, best, length=d, travel_time=d / config.AGENT_SPEED_M_PER_MIN,
                       capacity=cap, road_class=klass, flood_susceptibility=round(fe, 4))
            main |= comp
    return G


# --------------------------------------------------------------------------- #
# Derived accessors
# --------------------------------------------------------------------------- #
def evacuation_center_nodes(G: nx.Graph | None = None) -> list[str]:
    G = G or build_graph()
    return [n for n, d in G.nodes(data=True) if d.get("is_center")]


def origin_zone_nodes(G: nx.Graph | None = None) -> list[str]:
    G = G or build_graph()
    return [n for n, d in G.nodes(data=True) if d.get("node_type") == "Origin Zone" and d.get("population", 0) > 0]


def origins_payload() -> list[dict[str, Any]]:
    G = build_graph()
    out = []
    for n in origin_zone_nodes(G):
        d = G.nodes[n]
        out.append({
            "node_id": n, "barangay": d["barangay"], "population": d["population"],
            "lat": d["lat"], "lon": d["lon"], "flood_risk": d["flood_risk"],
        })
    return out


def centers_payload() -> list[dict[str, Any]]:
    """Evacuation centers for the map. Prototype graph centers, enriched with the
    named historical centers found in the CSV ``evacuation_center`` column."""
    G = build_graph()
    out = []
    for n in evacuation_center_nodes(G):
        d = G.nodes[n]
        out.append({
            "node_id": n, "name": d["notes"] or d["barangay"], "barangay": d["barangay"],
            "lat": d["lat"], "lon": d["lon"], "elevation": d["elevation"],
        })
    return out


def flood_points_payload(limit: int = 800) -> list[dict[str, Any]]:
    """Flood-risk heat points from the CSV (lat/lon + risk level)."""
    df = load_flood_csv()
    cols = ["latitude", "longitude", "flood_risk_level", "flood_depth_meters",
            "city_municipality", "barangay"]
    sub = df[cols].dropna(subset=["latitude", "longitude"]).head(limit)
    pts = []
    for _, r in sub.iterrows():
        pts.append({
            "lat": float(r["latitude"]), "lon": float(r["longitude"]),
            "risk": r["flood_risk_level"], "depth": float(r["flood_depth_meters"]),
            "fe": _risk_to_fe(r["flood_risk_level"]),
            "city": r["city_municipality"], "barangay": r["barangay"],
        })
    return pts


def dataset_stats() -> dict[str, Any]:
    df = load_flood_csv()
    return {
        "csv_records": int(len(df)),
        "csv_columns": int(df.shape[1]),
        "year_min": int(df["year"].min()),
        "year_max": int(df["year"].max()),
        "cities_covered": int(df["city_municipality"].nunique()),
        "city_record_counts": df["city_municipality"].value_counts().to_dict(),
        "risk_counts": df["flood_risk_level"].value_counts().to_dict(),
        "unique_named_centers": int(df["evacuation_center"].nunique()),
        "response_time_hours": {
            "min": float(df["response_time_hours"].min()),
            "max": float(df["response_time_hours"].max()),
            "mean": round(float(df["response_time_hours"].mean()), 2),
        },
    }


def graph_summary() -> dict[str, Any]:
    G = build_graph()
    return {
        "prototype_nodes": G.number_of_nodes(),
        "prototype_edges": G.number_of_edges(),
        "origin_zones": len(origin_zone_nodes(G)),
        "evacuation_centers": len(evacuation_center_nodes(G)),
        "intersections": sum(1 for _, d in G.nodes(data=True) if d.get("node_type") == "Intersection"),
        "total_population": sum(d.get("population", 0) for _, d in G.nodes(data=True)),
        "bbox": config.METRO_MANILA_BBOX,
        "note": (
            "Prototype seed graph (Marikina sub-network, 1,250 nodes). "
            "Full Metro Manila runs use an OSMnx drive network "
            "(~80,000-150,000 nodes / ~200,000-400,000 edges; "
            "thesis sample ~5,000-15,000 nodes)."
        ),
    }
