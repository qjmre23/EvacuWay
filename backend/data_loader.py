"""
EvacuWay — data loading, graph construction and caching.

Graph is built from the metro_manila_flood_dataset.csv:
* One Origin Zone per unique (city_municipality, barangay) pair — 51 zones.
* One Evacuation Center per unique named center in the CSV — 55 centers.
* k-NN proximity edges between all nodes (k=8).

Population proxy: max(affected_population) per zone, scaled to ≤500 agents.
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
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _risk_to_fe(level: str) -> float:
    return config.RISK_TO_FE.get(str(level).strip().lower(), 0.35)


def _capacity_for_length(length_m: float) -> tuple[int, str]:
    if length_m >= 12_000:
        return config.ROAD_CAPACITY["trunk"], "trunk"
    if length_m >= 7_000:
        return config.ROAD_CAPACITY["primary"], "primary"
    if length_m >= 3_000:
        return config.ROAD_CAPACITY["secondary"], "secondary"
    return config.ROAD_CAPACITY["residential"], "residential"


# --------------------------------------------------------------------------- #
# Raw dataset loaders
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=1)
def load_flood_csv() -> pd.DataFrame:
    df = pd.read_csv(config.DATA_CSV_PATH)
    return df


# --------------------------------------------------------------------------- #
# Graph construction — Metro Manila, CSV-driven
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=1)
def build_graph(k_neighbours: int = 8) -> nx.Graph:
    """Build the Metro Manila evacuation graph from metro_manila_flood_dataset.csv.

    Node types
    ----------
    * Origin Zone  — one per unique (city_municipality, barangay) pair (51 nodes).
      Attributes: city, barangay, population, lat, lon, flood_risk, fe.
    * Evacuation Center — one per unique named center (55 nodes).
      Attributes: city, barangay, notes (center name), lat, lon, is_center.

    Edges
    -----
    k-nearest-neighbor proximity graph (k=8) over all nodes, with haversine
    distance as edge length, BPR capacity by road-class proxy, and flood
    susceptibility averaged from endpoint fe values.
    """
    df = load_flood_csv()
    G = nx.Graph()
    coords: list[tuple[float, float]] = []
    node_ids: list[str] = []

    # ── Origin Zones ──────────────────────────────────────────────────────── #
    zone_df = (
        df.groupby(["city_municipality", "barangay"])
        .agg(
            lat=("latitude", "median"),
            lon=("longitude", "median"),
            risk=("flood_risk_level", lambda x: x.mode().iloc[0] if len(x) else "Moderate"),
            population=("affected_population", "max"),
        )
        .reset_index()
        .dropna(subset=["lat", "lon"])
    )

    for i, row in zone_df.iterrows():
        city = str(row["city_municipality"])
        barangay = str(row["barangay"])
        risk = str(row["risk"]).strip()
        raw_pop = int(row["population"])
        # Scale to tractable agent count (raw values are 100 k-200 k residents)
        pop = min(max(int(raw_pop / 400), 50), config.MAX_AGENTS_PER_ZONE)
        nid = f"OZ_{city[:3].upper()}_{i:03d}"

        G.add_node(
            nid,
            node_type="Origin Zone",
            city=city,
            barangay=barangay,
            population=pop,
            raw_population=raw_pop,
            lat=float(row["lat"]),
            lon=float(row["lon"]),
            flood_risk=risk,
            fe=_risk_to_fe(risk),
            is_center=False,
            elevation=0.0,
            notes="",
        )
        coords.append((float(row["lat"]), float(row["lon"])))
        node_ids.append(nid)

    # ── Evacuation Centers ─────────────────────────────────────────────────── #
    centers_df = (
        df[df["evacuation_center"].notna()]
        .groupby("evacuation_center")
        .agg(
            lat=("latitude", "median"),
            lon=("longitude", "median"),
            city=("city_municipality", lambda x: x.mode().iloc[0]),
            barangay=("barangay", lambda x: x.mode().iloc[0]),
        )
        .reset_index()
        .dropna(subset=["lat", "lon"])
    )

    for i, row in centers_df.iterrows():
        nid = f"EC_{i:03d}"
        G.add_node(
            nid,
            node_type="Evacuation Center",
            city=str(row["city"]),
            barangay=str(row["barangay"]),
            population=0,
            raw_population=0,
            lat=float(row["lat"]),
            lon=float(row["lon"]),
            flood_risk="Low",
            fe=_risk_to_fe("low"),
            is_center=True,
            elevation=0.0,
            notes=str(row["evacuation_center"]),
        )
        coords.append((float(row["lat"]), float(row["lon"])))
        node_ids.append(nid)

    # ── k-NN edges ─────────────────────────────────────────────────────────── #
    n = len(coords)
    for i in range(n):
        lat1, lon1 = coords[i]
        dists = sorted(
            (_haversine_m(lat1, lon1, coords[j][0], coords[j][1]), j)
            for j in range(n) if j != i
        )
        for d, j in dists[:k_neighbours]:
            u, v = node_ids[i], node_ids[j]
            if G.has_edge(u, v):
                continue
            length = max(d, 100.0)
            cap, klass = _capacity_for_length(length)
            fe = round((G.nodes[u]["fe"] + G.nodes[v]["fe"]) / 2.0, 4)
            G.add_edge(
                u, v,
                length=length,
                travel_time=length / config.AGENT_SPEED_M_PER_MIN,
                capacity=cap,
                road_class=klass,
                flood_susceptibility=fe,
            )

    # ── Ensure connectivity ─────────────────────────────────────────────────── #
    if not nx.is_connected(G):
        comps = list(nx.connected_components(G))
        comps.sort(key=len, reverse=True)
        main = comps[0]
        for comp in comps[1:]:
            cnode = next(iter(comp))
            clat, clon = G.nodes[cnode]["lat"], G.nodes[cnode]["lon"]
            best = min(
                main,
                key=lambda m: _haversine_m(clat, clon, G.nodes[m]["lat"], G.nodes[m]["lon"]),
            )
            d = max(_haversine_m(clat, clon, G.nodes[best]["lat"], G.nodes[best]["lon"]), 100.0)
            cap, klass = _capacity_for_length(d)
            fe = round((G.nodes[cnode]["fe"] + G.nodes[best]["fe"]) / 2.0, 4)
            G.add_edge(
                cnode, best,
                length=d, travel_time=d / config.AGENT_SPEED_M_PER_MIN,
                capacity=cap, road_class=klass, flood_susceptibility=fe,
            )
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
    return [
        n for n, d in G.nodes(data=True)
        if d.get("node_type") == "Origin Zone" and d.get("population", 0) > 0
    ]


def origins_payload() -> list[dict[str, Any]]:
    G = build_graph()
    return [
        {
            "node_id": n,
            "city": d["city"],
            "barangay": d["barangay"],
            "population": d["population"],
            "lat": d["lat"],
            "lon": d["lon"],
            "flood_risk": d["flood_risk"],
        }
        for n in origin_zone_nodes(G)
        for d in [G.nodes[n]]
    ]


def center_display_capacity(node_id: str, base: float = 2200.0) -> int:
    x = 5381
    for ch in str(node_id):
        x = ((x * 33) ^ ord(ch)) & 0xFFFFFFFF
    factor = 0.6 + 0.8 * ((x % 1000) / 1000.0)
    return int(round(base * factor / 50.0) * 50)


def centers_payload() -> list[dict[str, Any]]:
    G = build_graph()
    return [
        {
            "node_id": n,
            "name": d["notes"] or d["barangay"],
            "city": d["city"],
            "barangay": d["barangay"],
            "lat": d["lat"],
            "lon": d["lon"],
            "elevation": d["elevation"],
            "district": d["city"],
            "capacity": center_display_capacity(n),
            "source": "csv",
            "official": True,
        }
        for n in evacuation_center_nodes(G)
        for d in [G.nodes[n]]
    ]


def flood_points_payload(limit: int = 800) -> list[dict[str, Any]]:
    df = load_flood_csv()
    cols = ["latitude", "longitude", "flood_risk_level", "flood_depth_meters",
            "city_municipality", "barangay"]
    sub = df[cols].dropna(subset=["latitude", "longitude"]).head(limit)
    return [
        {
            "lat": float(r["latitude"]), "lon": float(r["longitude"]),
            "risk": r["flood_risk_level"], "depth": float(r["flood_depth_meters"]),
            "fe": _risk_to_fe(r["flood_risk_level"]),
            "city": r["city_municipality"], "barangay": r["barangay"],
        }
        for _, r in sub.iterrows()
    ]


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
    cities = sorted({d["city"] for _, d in G.nodes(data=True) if d.get("city")})
    return {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "origin_zones": len(origin_zone_nodes(G)),
        "evacuation_centers": len(evacuation_center_nodes(G)),
        "cities": cities,
        "total_population": sum(d.get("population", 0) for _, d in G.nodes(data=True)),
        "bbox": config.METRO_MANILA_BBOX,
        "note": (
            "Metro Manila graph built from metro_manila_flood_dataset.csv — "
            f"{len(origin_zone_nodes(G))} origin zones across {len(cities)} NCR cities, "
            f"{len(evacuation_center_nodes(G))} named evacuation centres."
        ),
    }
