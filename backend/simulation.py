"""
EvacuWay — core evacuation-routing simulation engine.

Implements the three comparative routing strategies and the shared Bernoulli
flood-disruption engine, then derives the six project KPIs.

Strategies
----------
A — Dijkstra shortest-path (decentralised). Every origin routes independently to
    its nearest reachable centre on the free-flow distance graph. Experienced
    travel time still includes BPR congestion on the resulting flows, so A
    saturates popular corridors.
B — Frank-Wolfe / capacity-aware (centralised). Iterative traffic assignment
    (Method of Successive Averages) that routes on the *congested* BPR cost,
    balancing load across parallel corridors.
C — Zone-Sequential priority (phased). Barangays depart in waves ordered by flood
    risk (Very High -> High -> Moderate -> Low); a wave starts only after the
    previous wave has cleared 80 %. Within a wave, Dijkstra is used. Phasing
    lowers the simultaneous peak load.

Bernoulli disruption engine
---------------------------
Each edge is independently removed with probability ``fe * λF`` where ``fe`` is
the edge flood susceptibility and ``λF`` the severity multiplier.

KPIs
----
TET, AET, ECR, NUI, EI (Gini), SCP — see ``_compute_kpis``.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

import networkx as nx
import numpy as np

from . import config
from .data_loader import build_graph, evacuation_center_nodes, origin_zone_nodes

# BPR parameters
BPR_ALPHA = 0.15
BPR_BETA = 4.0

# Evacuation horizon (hours) over which an edge's hourly capacity can discharge
# vehicles. capacity_stock_e = capacity_veh_per_hr * EVAC_HORIZON_HOURS converts
# the road's flow capacity into a stock the simulated demand is measured against.
EVAC_HORIZON_HOURS = 3.0
# Volume/capacity ratio is clamped here so a single saturated edge cannot produce
# physically absurd travel times on the small prototype graph.
VC_CAP = 4.0


# --------------------------------------------------------------------------- #
# Bernoulli disruption engine
# --------------------------------------------------------------------------- #
def apply_flood_closures(G: nx.Graph, flood_level: str, rng: np.random.Generator) -> nx.Graph:
    """Return a copy of ``G`` with flood-closed edges removed.

    Probability of closure for edge e = fe_e * λF.
    """
    H = G.copy()
    lambda_f = config.LAMBDA_F[flood_level]
    to_remove = []
    for u, v, data in H.edges(data=True):
        fe = data.get("flood_susceptibility", 0.0)
        if rng.random() < fe * lambda_f:
            to_remove.append((u, v))
    H.remove_edges_from(to_remove)
    # Surviving flood-exposed roads are passable but slower (partial inundation).
    for u, v, data in H.edges(data=True):
        fe = data.get("flood_susceptibility", 0.0)
        data["base_time"] = data["travel_time"] * (1 + config.FLOOD_SLOWDOWN * fe * lambda_f)
    return H, to_remove


# --------------------------------------------------------------------------- #
# Result container
# --------------------------------------------------------------------------- #
@dataclass
class RunResult:
    run_id: str
    strategy: str
    flood_level: str
    seed: int
    kpis: dict[str, float]
    closed_edges: int
    total_agents: int
    completed_agents: int
    routes: list[dict[str, Any]] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "strategy": self.strategy,
            "flood_level": self.flood_level,
            "seed": self.seed,
            "kpis": self.kpis,
            "closed_edges": self.closed_edges,
            "total_agents": self.total_agents,
            "completed_agents": self.completed_agents,
            "routes": self.routes,
            "meta": self.meta,
        }


# --------------------------------------------------------------------------- #
# Engine
# --------------------------------------------------------------------------- #
class EvacuationSimulator:
    def __init__(self, graph: nx.Graph | None = None):
        self.G = graph or build_graph()

    # -- shortest paths from every node to its nearest centre ----------------- #
    @staticmethod
    def _multi_source_routes(H: nx.Graph, centers: list[str], weight: str):
        """Return (dist, path) dicts: for each node, distance/path to nearest centre.

        Paths are returned oriented origin -> centre (the evacuation direction).
        """
        sources = [c for c in centers if c in H]
        if not sources:
            return {}, {}
        dist, paths = nx.multi_source_dijkstra(H, sources, weight=weight)
        oriented = {n: list(reversed(p)) for n, p in paths.items()}
        return dist, oriented

    # -- BPR congestion cost -------------------------------------------------- #
    def _assign_flows(self, H: nx.Graph, origins: list[str], paths: dict[str, list[str]]):
        """Sum origin populations along their chosen paths -> per-edge flow (veh/hr proxy)."""
        flows: dict[tuple[str, str], float] = {}
        for o in origins:
            p = paths.get(o)
            if not p or len(p) < 2:
                continue
            load = self.G.nodes[o]["population"] * config.DEMAND_SCALE
            for a, b in zip(p[:-1], p[1:]):
                key = (a, b) if (a, b) in flows else ((b, a) if (b, a) in flows else (a, b))
                flows[key] = flows.get(key, 0.0) + load
        return flows

    def _vc(self, data: dict, flow: float) -> float:
        """Volume/capacity ratio measured against the evacuation-horizon stock."""
        cap_stock = max(data.get("capacity", 400) * EVAC_HORIZON_HOURS, 1.0)
        return flow / cap_stock

    def _congested_weight_graph(self, H: nx.Graph, flows: dict) -> None:
        """Write a ``cost`` attribute (minutes) on every edge = flood-slowed free
        time * BPR congestion factor."""
        for u, v, data in H.edges(data=True):
            x = flows.get((u, v), flows.get((v, u), 0.0))
            vc = min(self._vc(data, x), VC_CAP)
            t0 = data.get("base_time", data["travel_time"])
            data["cost"] = t0 * (1 + BPR_ALPHA * vc ** BPR_BETA)

    def _path_time(self, H: nx.Graph, path: list[str]) -> float:
        """Congested travel time (minutes) along a path using current edge ``cost``."""
        t = 0.0
        for a, b in zip(path[:-1], path[1:]):
            data = H.get_edge_data(a, b) or {}
            t += data.get("cost", data.get("travel_time", 0.0))
        return t

    def _queue_delay(self, origin: str) -> float:
        return self.G.nodes[origin]["population"] / config.ORIGIN_DISCHARGE_PER_MIN

    # -- capacitated assignment ---------------------------------------------- #
    def _center_capacity(self, c: str) -> float:
        """Finite shelter capacity per evacuation centre (agents). Deterministic
        per-centre variation so nearby centres fill and demand spills to farther
        ones — the spillover is what makes routing strategy matter."""
        base = config.CENTER_CAPACITY_BASE
        jitter = 0.6 + 0.8 * ((hash(c) % 1000) / 1000.0)  # 0.6x .. 1.4x
        return base * jitter

    def _capacitated_assign(self, H, centers, origins, weight, cap_left=None):
        """Assign each origin to its nearest centre that still has shelter capacity.

        Rounds: route all unassigned origins to the nearest OPEN centre; fill each
        centre nearest-first until capacity is exceeded, then close it; repeat.
        Returns ``paths`` (origin -> oriented origin->centre path) for assigned
        origins. ``cap_left`` may be shared across calls (Strategy C waves).
        """
        open_centers = {c for c in centers if c in H}
        if cap_left is None:
            cap_left = {c: self._center_capacity(c) for c in open_centers}
        else:
            open_centers = {c for c in open_centers if cap_left.get(c, 0) > 0}
        remaining = set(origins)
        paths: dict[str, list[str]] = {}

        for _round in range(12):
            if not remaining or not open_centers:
                break
            dist, oriented = self._multi_source_routes(H, list(open_centers), weight)
            by_center: dict[str, list] = {}
            for o in list(remaining):
                p = oriented.get(o)
                if not p or len(p) < 2:
                    continue
                by_center.setdefault(p[-1], []).append((dist[o], o, p))
            if not by_center:
                break
            for c, lst in by_center.items():
                lst.sort(key=lambda t: t[0])  # nearest origins first
                for d, o, p in lst:
                    if cap_left.get(c, 0) <= 0:
                        open_centers.discard(c)
                        break  # centre full; remaining origins re-route next round
                    paths[o] = p
                    cap_left[c] -= self.G.nodes[o]["population"]
                    remaining.discard(o)
                    if cap_left[c] <= 0:
                        open_centers.discard(c)
        return paths

    # -- strategy drivers ----------------------------------------------------- #
    # Each returns (paths, flows_for_NUI, clearance_minutes_per_origin).
    def _route_strategy_a(self, H, centers, origins):
        """Decentralised shortest distance to nearest available centre; congestion
        and flooding are experienced on the chosen path but not routed around."""
        paths = self._capacitated_assign(H, centers, origins, weight="length")
        flows = self._assign_flows(H, list(paths), paths)
        self._congested_weight_graph(H, flows)
        clearance = {o: self._path_time(H, paths[o]) + self._queue_delay(o) for o in paths}
        return paths, flows, clearance

    def _route_strategy_b(self, H, centers, origins, iterations=4):
        """Frank-Wolfe / MSA capacity-aware assignment on the congested BPR cost,
        routing around both flooded and saturated corridors."""
        paths = self._capacitated_assign(H, centers, origins, weight="base_time")
        flows = self._assign_flows(H, list(paths), paths)
        for k in range(1, iterations):
            self._congested_weight_graph(H, flows)
            new_paths = self._capacitated_assign(H, centers, origins, weight="cost")
            new_flows = self._assign_flows(H, list(new_paths), new_paths)
            lam = 1.0 / (k + 1)  # MSA step size
            flows = {key: (1 - lam) * flows.get(key, 0.0) + lam * new_flows.get(key, 0.0)
                     for key in set(flows) | set(new_flows)}
            paths = new_paths
        self._congested_weight_graph(H, flows)
        clearance = {o: self._path_time(H, paths[o]) + self._queue_delay(o) for o in paths}
        return paths, flows, clearance

    def _route_strategy_c(self, H, centers, origins):
        """Phased waves by flood risk. Centre capacity is shared across waves; each
        wave experiences only its OWN congestion (temporal separation) but pays the
        cumulative wait for the previous wave to clear 80%."""
        order = {"Very High": 0, "High": 1, "Moderate": 2, "Low": 3}
        waves: dict[int, list[str]] = {}
        for o in origins:
            waves.setdefault(order.get(self.G.nodes[o]["flood_risk"], 2), []).append(o)

        cap_left = {c: self._center_capacity(c) for c in centers if c in H}
        total_flows: dict[tuple[str, str], float] = {}
        all_paths: dict[str, list[str]] = {}
        clearance: dict[str, float] = {}
        cumulative_offset = 0.0
        for w in sorted(waves):
            paths = self._capacitated_assign(H, centers, waves[w], weight="length", cap_left=cap_left)
            wave_flows = self._assign_flows(H, list(paths), paths)
            self._congested_weight_graph(H, wave_flows)  # wave-local congestion
            wave_clear = []
            for o, p in paths.items():
                t = self._path_time(H, p) + self._queue_delay(o)
                clearance[o] = t + cumulative_offset
                all_paths[o] = p
                wave_clear.append(t)
            for key, val in wave_flows.items():
                total_flows[key] = total_flows.get(key, 0.0) + val
            if wave_clear:
                cumulative_offset += 0.8 * float(np.percentile(wave_clear, 80))
        return all_paths, total_flows, clearance

    # -- KPI computation ------------------------------------------------------ #
    def _compute_kpis(self, H, origins, paths, flows, clearance):
        total_pop = sum(self.G.nodes[o]["population"] for o in origins)
        reachable_pop = sum(self.G.nodes[o]["population"] for o in origins if o in clearance)
        if total_pop == 0 or not clearance:
            return {"TET": 0.0, "AET": 0.0, "ECR": 0.0, "NUI": 0.0, "EI": 0.0, "SCP": 0.0}, \
                total_pop, 0

        times = np.array([clearance[o] for o in clearance], dtype=float)
        pops = np.array([self.G.nodes[o]["population"] for o in clearance], dtype=float)

        completed_pop = int(sum(p for o, p in
                                ((o, self.G.nodes[o]["population"]) for o in clearance)
                                if clearance[o] <= config.EVAC_WINDOW_MIN))

        tet = float(times.max())
        aet = float(np.average(times, weights=pops))
        ecr = 100.0 * completed_pop / total_pop

        # NUI — mean volume/capacity over edges actually carrying flow
        utils = [self._vc(H.get_edge_data(u, v) or {}, x)
                 for (u, v), x in flows.items() if x > 0 and H.has_edge(u, v)]
        nui = float(np.mean(utils)) if utils else 0.0

        ei = _gini(times, pops)

        # SCP — % agents surviving: timely arrivals always survive; trapped/late
        # agents shelter at a rate that shrinks as flooding worsens.
        shelter_rate = {"mild": 0.55, "moderate": 0.40, "severe": 0.18}[self._flood_level]
        survived = completed_pop + (total_pop - completed_pop) * shelter_rate
        scp = 100.0 * survived / total_pop

        return {
            "TET": round(tet, 1), "AET": round(aet, 1), "ECR": round(ecr, 1),
            "NUI": round(nui, 3), "EI": round(ei, 3), "SCP": round(scp, 1),
        }, total_pop, completed_pop

    # -- public API ----------------------------------------------------------- #
    def run(self, strategy: str, flood_level: str, seed: int,
            city_subset: list[str] | None = None, include_routes: bool = False) -> RunResult:
        strategy = strategy.upper()
        flood_level = flood_level.lower()
        if strategy not in config.STRATEGIES:
            raise ValueError(f"unknown strategy {strategy!r}")
        if flood_level not in config.FLOOD_LEVELS:
            raise ValueError(f"unknown flood level {flood_level!r}")
        self._flood_level = flood_level

        rng = np.random.default_rng(seed)
        H, closed = apply_flood_closures(self.G, flood_level, rng)

        centers = evacuation_center_nodes(self.G)
        origins = origin_zone_nodes(self.G)
        if city_subset:
            wanted = {c.strip().lower() for c in city_subset}
            origins = [o for o in origins if self.G.nodes[o]["barangay"].lower() in wanted] or origins

        if strategy == "A":
            paths, flows, clearance = self._route_strategy_a(H, centers, origins)
        elif strategy == "B":
            paths, flows, clearance = self._route_strategy_b(H, centers, origins)
        else:
            paths, flows, clearance = self._route_strategy_c(H, centers, origins)

        kpis, total_pop, completed_pop = self._compute_kpis(H, origins, paths, flows, clearance)

        routes = []
        if include_routes:
            # return a representative sample of route geometries for the map
            for o in origins[:120]:
                p = paths.get(o)
                if not p or len(p) < 2:
                    continue
                coords = [[self.G.nodes[n]["lat"], self.G.nodes[n]["lon"]] for n in p]
                routes.append({
                    "origin": o, "destination": p[-1],
                    "population": self.G.nodes[o]["population"], "coords": coords,
                })

        run_id = f"{strategy}_{flood_level}_{seed}"
        return RunResult(
            run_id=run_id, strategy=strategy, flood_level=flood_level, seed=seed,
            kpis=kpis, closed_edges=len(closed), total_agents=int(total_pop),
            completed_agents=int(completed_pop), routes=routes,
            meta={"origins": len(origins), "centers": len(centers),
                  "edges_after_flood": H.number_of_edges()},
        )


def _gini(values: np.ndarray, weights: np.ndarray) -> float:
    """Weighted Gini coefficient (0 = perfectly equal clearance times)."""
    if values.size == 0:
        return 0.0
    order = np.argsort(values)
    v = values[order]
    w = weights[order]
    cw = np.cumsum(w)
    cv = np.cumsum(v * w)
    if cv[-1] == 0 or cw[-1] == 0:
        return 0.0
    lorenz = cv / cv[-1]
    pop = cw / cw[-1]
    # trapezoidal area between Lorenz curve and equality line
    b = np.trapezoid(lorenz, pop) if hasattr(np, "trapezoid") else np.trapz(lorenz, pop)
    return float(max(0.0, 1 - 2 * b))


# convenience module-level singleton
_SIM: EvacuationSimulator | None = None


def get_simulator() -> EvacuationSimulator:
    global _SIM
    if _SIM is None:
        _SIM = EvacuationSimulator()
    return _SIM
