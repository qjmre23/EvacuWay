"""
EvacuWay — snap simulation routes onto the real OSM road network.

The prototype simulation graph is a k-nearest-neighbour proximity graph, so a
route is a sequence of node centroids. Drawn directly, the connecting segments
cut straight across blocks and buildings instead of following streets. This
module rewrites that geometry so every drawn route follows real roads.

It loads the compiled road-network artifact ``data/marikina_road_network.json``
(produced by ``scripts/build_road_network.mjs`` from an OSMnx/Overpass drive
network) and, for each route, connects the origin to its assigned evacuation
centre along the shortest road path. If that path is implausible — the abstract
prototype graph occasionally pairs an origin with a centre across the Marikina
River — the route falls back to the nearest centre *by road*, so the drawn line
is always sensible and on-street.

This mirrors ``scripts/lib/road_graph.mjs`` + ``scripts/snap_routes.mjs`` (same
artifact, same algorithm) so live ``/api/simulate`` routes match the bundled
frontend snapshot. If the artifact is missing the original coordinates are
returned unchanged, so the API never depends on the road graph being present.
"""
from __future__ import annotations

import heapq
import json
import math
from functools import lru_cache
from typing import Optional

from . import config

# Implausible-assignment guard (kept identical to scripts/snap_routes.mjs).
GUARD_MIN_LEN_M = 900.0      # only second-guess routes longer than this
GUARD_MAX_DETOUR = 4.0       # ... whose road length exceeds 4x the straight line
KEEP_ENDPOINT_M = 45.0       # keep the original marker endpoint if this close to a road

ROAD_NETWORK_PATH = config.DATA_DIR / "marikina_road_network.json"

_EARTH_R = 6_371_000.0


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * _EARTH_R * math.asin(math.sqrt(a))


class RoadSnapper:
    """In-memory routable road graph with nearest-node snapping and Dijkstra."""

    def __init__(self, path=ROAD_NETWORK_PATH):
        art = json.loads(path.read_text(encoding="utf-8"))
        node_items = list(art["nodes"].items())
        self.n = len(node_items)
        self.lat = [0.0] * self.n
        self.lon = [0.0] * self.n
        self._idx: dict[str, int] = {}
        for i, (nid, (la, lo)) in enumerate(node_items):
            self._idx[nid] = i
            self.lat[i] = la
            self.lon[i] = lo

        # Adjacency list with haversine edge weights (undirected).
        self.adj: list[list[tuple[int, float]]] = [[] for _ in range(self.n)]
        for a, b in art["edges"]:
            ia = self._idx.get(a)
            ib = self._idx.get(b)
            if ia is None or ib is None:
                continue
            w = _haversine(self.lat[ia], self.lon[ia], self.lat[ib], self.lon[ib])
            self.adj[ia].append((ib, w))
            self.adj[ib].append((ia, w))

        # Spatial grid (~110 m cells) for nearest-node queries.
        self._cell = 0.001
        self._grid: dict[tuple[int, int], list[int]] = {}
        for i in range(self.n):
            key = (int(self.lat[i] / self._cell), int(self.lon[i] / self._cell))
            self._grid.setdefault(key, []).append(i)

        self._path_cache: dict[tuple[int, int], Optional[list[int]]] = {}

    # -- snapping ------------------------------------------------------------- #
    def nearest(self, lat: float, lon: float) -> int:
        ci = int(lat / self._cell)
        cj = int(lon / self._cell)
        best, best_d = -1, math.inf
        for ring in range(0, 41):
            for di in range(-ring, ring + 1):
                for dj in range(-ring, ring + 1):
                    if max(abs(di), abs(dj)) != ring:
                        continue  # ring shell only
                    for i in self._grid.get((ci + di, cj + dj), ()):
                        d = _haversine(lat, lon, self.lat[i], self.lon[i])
                        if d < best_d:
                            best_d, best = d, i
            if best >= 0 and ring >= 1:
                break
        return best

    # -- routing -------------------------------------------------------------- #
    def shortest(self, src: int, dst: int) -> Optional[list[int]]:
        if src == dst:
            return [src]
        ck = (src, dst)
        if ck in self._path_cache:
            return self._path_cache[ck]
        dist = {src: 0.0}
        prev: dict[int, int] = {}
        pq: list[tuple[float, int]] = [(0.0, src)]
        found = False
        while pq:
            d, u = heapq.heappop(pq)
            if u == dst:
                found = True
                break
            if d > dist.get(u, math.inf):
                continue
            for v, w in self.adj[u]:
                nd = d + w
                if nd < dist.get(v, math.inf):
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(pq, (nd, v))
        if not found:
            self._path_cache[ck] = None
            return None
        path = [dst]
        while path[-1] != src:
            path.append(prev[path[-1]])
        path.reverse()
        self._path_cache[ck] = path
        return path

    def shortest_to_set(self, src: int, targets: frozenset[int]):
        if src in targets:
            return [src], src
        dist = {src: 0.0}
        prev: dict[int, int] = {}
        pq: list[tuple[float, int]] = [(0.0, src)]
        hit = -1
        while pq:
            d, u = heapq.heappop(pq)
            if u in targets:
                hit = u
                break
            if d > dist.get(u, math.inf):
                continue
            for v, w in self.adj[u]:
                nd = d + w
                if nd < dist.get(v, math.inf):
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(pq, (nd, v))
        if hit < 0:
            return None, -1
        path = [hit]
        while path[-1] != src:
            path.append(prev[path[-1]])
        path.reverse()
        return path, hit

    def path_len(self, path: list[int]) -> float:
        total = 0.0
        for a, b in zip(path[:-1], path[1:]):
            total += _haversine(self.lat[a], self.lon[a], self.lat[b], self.lon[b])
        return total

    def _coords(self, path: list[int]) -> list[list[float]]:
        return [[round(self.lat[i], 6), round(self.lon[i], 6)] for i in path]

    # -- public: snap one route ---------------------------------------------- #
    def snap_route(self, coords: list[list[float]],
                   center_targets: Optional[frozenset[int]] = None) -> list[list[float]]:
        """Return ``coords`` rewritten to follow roads from origin to centre."""
        if not coords or len(coords) < 2:
            return coords
        origin, dest = coords[0], coords[-1]
        o_node = self.nearest(origin[0], origin[1])
        d_node = self.nearest(dest[0], dest[1])
        if o_node < 0 or d_node < 0:
            return coords

        straight = max(_haversine(origin[0], origin[1], dest[0], dest[1]), 1.0)
        path = self.shortest(o_node, d_node)
        used_fallback = False
        length = self.path_len(path) if path else math.inf
        implausible = path is None or (length > GUARD_MIN_LEN_M and length / straight > GUARD_MAX_DETOUR)
        if implausible and center_targets:
            alt, _tgt = self.shortest_to_set(o_node, center_targets)
            if alt and (path is None or self.path_len(alt) < length):
                path = alt
                used_fallback = True
        if not path:
            return coords

        line = self._coords(path)
        start_snap = _haversine(origin[0], origin[1], line[0][0], line[0][1])
        end_snap = _haversine(dest[0], dest[1], line[-1][0], line[-1][1])
        out: list[list[float]] = []
        if start_snap <= KEEP_ENDPOINT_M:
            out.append([round(origin[0], 6), round(origin[1], 6)])
        out.extend(line)
        if not used_fallback and end_snap <= KEEP_ENDPOINT_M:
            out.append([round(dest[0], 6), round(dest[1], 6)])

        deduped: list[list[float]] = []
        for c in out:
            if deduped and deduped[-1] == c:
                continue
            deduped.append(c)
        return deduped if len(deduped) >= 2 else coords


@lru_cache(maxsize=1)
def get_snapper() -> Optional[RoadSnapper]:
    """Load the road snapper once. Returns ``None`` if the artifact is absent so
    the simulation falls back to raw straight-line geometry without erroring."""
    try:
        if not ROAD_NETWORK_PATH.exists():
            return None
        return RoadSnapper()
    except Exception:
        return None
