# EvacuWay — Geographic Scope Normalisation Notes (Task 5)

Log of every geographic reference normalised from Marikina-only to Metro-Manila-wide.

## Bounding box

| Context | Old (Marikina) | New (Metro Manila) |
|---|---|---|
| Latitude | 14.52–14.68 N | **14.35–14.78 N** |
| Longitude | 120.97–121.13 E | **120.90–121.20 E** |

Defined once in `backend/config.py::METRO_MANILA_BBOX` and consumed by the API (`/api/meta`), the
frontend map (`MapView.tsx`), and the docs.

## Place query

| Old | New |
|---|---|
| `"Marikina City, Philippines"` | `"Metro Manila, Philippines"` (or 17-LGU loop) |

## Variable / label renames

| Old name | New name |
|---|---|
| `marikina_graph` | `metro_manila_graph` |
| `marikina_bbox` | `metro_manila_bbox` (`METRO_MANILA_BBOX`) |
| `marikina_nodes` (full-run) | `ncr_nodes` / OSMnx-extracted |
| Figure captions "Marikina City" | "Metro Manila (NCR)" |
| Map title "Marikina" | "Metro Manila Evacuation Routing Simulation" |

## Retained Marikina references (allowed)

`Marikina` remains **only** where it is one of the 17 LGUs, or where it is explicitly qualified as the
prototype seed (e.g. `Evacuation_Marikina_Dataset.xlsx`, "Marikina sample subnetwork — prototype
validation only"). The consistency check (`scripts/consistency_check.py`) allows `Marikina` matches
that co-occur with `prototype | sample | seed | XLSX | xlsx | subnetwork | one of the 17 LGUs` and
flags any other occurrence.

## Hardcoded barangay lists

The prototype barangay lists (Marikina barangays such as Nangka, Marikina Heights, etc.) are confined
to the XLSX-derived prototype graph. The full run derives origin barangays from PSA census + OSMnx
across all 17 LGUs.
