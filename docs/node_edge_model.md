# EvacuWay — Node & Edge Model (Task 6)

## Node attributes

| Attribute | Type | Meaning |
|-----------|------|---------|
| `node_type` | str | Intersection / Origin Zone / Evacuation Center |
| `barangay` | str | Barangay or facility name |
| `population` | int | Agents to evacuate (Origin Zones; capped at 500 for thesis runs) |
| `elevation` | float | Metres above sea level |
| `lat`, `lon` | float | WGS84 coordinates |
| `is_center` | bool | Whether node is an evacuation center |
| `flood_risk` | str | Very High / High / Moderate / Low |
| `fe` | float | Node flood susceptibility (0.10–0.85) |

## Edge attributes

| Attribute | Type | Meaning |
|-----------|------|---------|
| `length` | float | Segment length (metres) |
| `travel_time` | float | Free-flow time (minutes) = length / speed |
| `base_time` | float | Flood-slowed free time = `travel_time · (1 + FLOOD_SLOWDOWN · fe · λF)` |
| `capacity` | int | Vehicles/hour by road class (residential 400, secondary 800, primary 1500, trunk 2500) |
| `road_class` | str | residential / secondary / primary / trunk |
| `flood_susceptibility` | float | Edge fe = mean of endpoint susceptibilities |
| `cost` | float | Congested time = `base_time · (1 + 0.15·(v/c)^4)` (BPR) |

## Prototype graph construction (shipped)

`backend/data_loader.py::build_graph`:
1. Load 1,250 XLSX nodes with coordinates, type, risk, population.
2. Connect each node to its **k = 4 nearest neighbours** (haversine) → ≈3,064 undirected edges.
3. Assign edge `length`, `capacity`/`road_class` (length-based proxy for OSM `highway` tag),
   and `flood_susceptibility`.
4. Guarantee connectivity (bridge isolated components to nearest main-component node).

## Capacity proxy (prototype) vs OSMnx (full)

The full pipeline reads capacity from the OSMnx `highway` tag (Assumption #8). The prototype has no
OSM tags, so capacity is assigned by a deterministic **length-based proxy** mapping to the same four
road classes — documented as a prototype simplification.

## Evacuation-center capacity

Each center has finite shelter capacity (`CENTER_CAPACITY_BASE`, default 2,200 agents, ±40 %
deterministic jitter). When nearby centers fill, demand spills to farther centers — the mechanism
that differentiates the three routing strategies (see [revised_results_analysis.md](revised_results_analysis.md)).
