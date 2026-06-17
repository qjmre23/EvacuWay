# EvacuWay — Revised Study Area (Task 5)

## Study area: Whole Metro Manila (NCR)

The study area is the **entire National Capital Region**, comprising **17 LGUs**. The simulation
bounding box is:

| | Latitude | Longitude |
|---|---|---|
| **Metro Manila (NCR)** | **14.35° – 14.78° N** | **120.90° – 121.20° E** |

This replaces the original draft's Marikina-only bounding box (14.52–14.68 N, 120.97–121.13 E), which
is now retained **only** as the extent of the prototype seed sub-network.

## Marikina = prototype sub-network only

Wherever Marikina appears in this project it is explicitly qualified as the
**"Marikina sample subnetwork — prototype validation only."** The Marikina XLSX seeds and validates
the graph-construction pipeline; it is not the study area and is not the primary simulation graph.

## OSMnx place query

Full-network extraction uses:

```python
ox.graph_from_place("Metro Manila, Philippines", network_type="drive")
# or a city-by-city loop over the 17 NCR LGUs for controlled extraction
```

(The original `"Marikina City, Philippines"` query is superseded.)

## Figure captions (corrected)

- **Figure 4 — Study area.** "Road network and flood-risk overlay for **Metro Manila (NCR), 17 LGUs**
  (bounding box 14.35–14.78 N, 120.90–121.20 E). Marikina sub-network shown inset as the prototype
  validation seed."
- **Figure 5 — Evacuation centers and origin zones.** "DSWD/DepEd evacuation centers (green) and
  populated origin barangays (orange) across **Metro Manila**; Marikina sample highlighted as
  prototype."

See [geo_scope_notes.md](geo_scope_notes.md) for the variable-renaming and label-normalisation log.
