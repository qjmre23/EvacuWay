# EvacuWay — Network Scale Story (Task 6)

One single, coherent node/edge count story, consistent across docs, code, and UI. The contradictory
"150–500 nodes" figure is **removed**.

## Official network-scale model

| Layer | Count | Source |
|-------|-------|--------|
| **Marikina prototype seed (XLSX)** | **1,250 nodes** | `Evacuation_Marikina_Dataset.xlsx` |
| **Metro Manila full OSMnx graph** | **~80,000–150,000 nodes, ~200,000–400,000 edges** | OSMnx drive network |
| **Thesis simulation sample (stratified)** | **~5,000–15,000 nodes, ~12,000–35,000 edges** | OSMnx + spatial sampling |
| Origin Zones (Metro Manila) | ~2,000–5,000 (one per populated barangay) | PSA 2020 census + CSV |
| Evacuation Centers | ~300–500 Metro-Manila-wide | DSWD/DepEd + CSV `evacuation_center` |

The **prototype graph actually shipped and executed** in this repository has **1,250 nodes /
≈3,064 edges** (k-nearest-neighbour proximity graph built from the XLSX), with **381 origin zones**
and **129 evacuation centers** — exposed live at `GET /api/network`.

## Graph-extraction pipeline (full Metro Manila)

Implemented in `scripts/extract_osmnx_graph.py`:

1. `ox.graph_from_place("Metro Manila, Philippines", network_type="drive")`.
2. Serialise to `data/metro_manila_graph.graphml` (cache locally to avoid repeated API calls).
3. Load barangay flood susceptibility from the CSV → assign `fe` to each edge via spatial join.
4. Load evacuation-center coordinates from CSV `evacuation_center` → geocode (Nominatim) → snap to
   nearest graph node.
5. Load origin-zone populations from CSV `affected_population` → snap to nearest node.
6. Export node/edge tables to `data/nodes.csv` and `data/edges.csv`.

For thesis-scale runtime (< 60 min), a **stratified spatial sample of ~10,000 nodes** is drawn from
the full graph (Assumption #5 in [assumptions.md](assumptions.md)).

## No contradictions

- 1,250 = Marikina **prototype seed** (never the full study network).
- Full simulation = **OSMnx Metro Manila graph**.
- The "150–500 nodes" figure does not appear anywhere (verified by `scripts/consistency_check.py`).

See [node_edge_model.md](node_edge_model.md) and [revised_parameter_table.md](revised_parameter_table.md).
