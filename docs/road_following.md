# Road-following route geometry

## Problem

The prototype network is a **k-nearest-neighbour proximity graph**
(`backend/data_loader.py`): each node is joined to its 4 nearest neighbours by a
straight haversine edge. The simulation is correct on this graph, but a route is
just a sequence of node centroids, so drawing it connects those centroids with
**straight lines that cut diagonally across blocks and buildings** instead of
following streets.

Toggle **"Straight (old)"** in the route verifier to see the original behaviour.

## Fix

Route geometry is snapped onto the **real OpenStreetMap drive network** for
Marikina. The simulation, KPIs and origin→centre assignments are unchanged —
only the *drawn* polyline is replaced:

1. The origin and its strategy-assigned evacuation centre are each snapped to the
   nearest node of the OSM road graph.
2. They are connected by the **shortest road path** (Dijkstra over real road
   segments), so every segment of the line is an actual road.
3. **Guard:** the abstract prototype graph occasionally pairs an origin with a
   centre on the far side of the Marikina River. If the road path is implausible
   (length > 900 m and > 4× the straight-line distance) the route falls back to
   the nearest centre *by road*, so no line makes an absurd loop.

The same artifact and algorithm are used in two places so the offline snapshot
and the live API agree:

| Where | File |
|-------|------|
| Live `/api/simulate` (Python) | `backend/road_snap.py` → called from `backend/simulation.py` |
| Bundled dashboard data (Node) | `scripts/lib/road_graph.mjs` + `scripts/snap_routes.mjs` |

The compiled road graph (`data/marikina_road_network.json`, 34,015 nodes /
37,196 edges — the largest connected component) is committed so neither path
needs network access at runtime. If it is missing, both paths fall back to the
original straight-line geometry without erroring.

## Verification

`node scripts/verify_on_road.mjs` audits **every segment of every route** in all
nine scenarios and confirms each one is either a real road edge or a ≤50 m
connector from a marker to the nearest road:

```
total segments: 25303
  on real road edge : 23935 (94.59%)
  endpoint connector: 1368 (max 44.2 m)
  VIOLATIONS        : 0
PASS — every route segment follows a real road.
```

`frontend/public/route_verify.html` is an interactive map (Leaflet + OSM tiles)
with A/B/C, flood-severity, layer and **Roads-vs-Straight** controls for visual
spot-checking.

## Regenerating

```bash
# 1. (optional) refresh the OSM road network for the route bbox
#    -> writes data/osm_cache/marikina_overpass.json   (Overpass `out geom`)
# 2. compile the routable artifact
node scripts/build_road_network.mjs        # -> data/marikina_road_network.json
# 3a. re-snap the bundled dashboard routes
node scripts/snap_routes.mjs               # -> frontend/public/sample_routes.json
# 3b. ...or regenerate everything from the live simulation (road-snapped)
python scripts/export_frontend_data.py
# 4. audit
node scripts/verify_on_road.mjs
```

The original straight-line routes are preserved in
`frontend/public/sample_routes.raw.json` (used as the snap input and by the
verifier's "Straight (old)" toggle).
