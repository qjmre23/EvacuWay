# EvacuWay — Revised Dataset Description (Task 4)

This section **replaces** the original draft's LIAR/PolitiFact dataset description in full. EvacuWay
uses two evacuation-simulation datasets:

## 1. `metro_manila_flood_dataset.csv`
A historical flood-incident database of **2,200 records** across **12 Metro Manila cities**, spanning
**2000–2024**, with **27 columns** (full schema in [data_dictionary.md](data_dictionary.md)). It is
the empirical backbone of the simulation, providing:

- **Flood susceptibility** per barangay (`flood_risk_level`, `flood_depth_meters`) → per-edge fe.
- **Population loads** for origin zones (`affected_population`, `evacuees`).
- **Historical evacuation-center locations** (`evacuation_center`, 55 named facilities).
- **Typhoon severity** parameters (`typhoon_alert_level` → λF).
- **Response-time benchmarks** (`response_time_hours`, 0.5–24.0 h) for KPI validation.

## 2. `Evacuation_Marikina_Dataset.xlsx`
A **1,250-node Marikina prototype sub-network** with **10 columns**: 740 Intersections (59.2 %),
381 Origin Zones (30.5 %), 129 Evacuation Centers (10.3 %). It seeds graph construction and agent
placement for the prototype, and validates the preprocessing pipeline. **It is a prototype seed
only** — full Metro Manila runs use the OSMnx graph (see [network_scale.md](network_scale.md)).

## 3. Data-coverage gap (12 of 17 NCR LGUs) and mitigation

The CSV covers **12 of the 17 NCR LGUs**. **Five LGUs have zero records**: **Makati, Mandaluyong,
Pasay, Pateros, San Juan.**

**Mitigation strategy:**
1. Extract road network for all 17 LGUs from **OSMnx** (independent of the CSV), so the network graph
   already covers the five missing cities.
2. Supplement flood susceptibility for the missing cities from **NDRRMC public records** where
   available.
3. Where records are unavailable, **interpolate flood susceptibility from adjacent cities** (e.g.
   Makati/Mandaluyong/San Juan from neighbouring Manila, Pasig, Quezon City; Pasay from Manila/Parañaque;
   Pateros from Taguig). Documented as an explicit modelling assumption in
   [assumptions.md](assumptions.md).

This gap affects only the empirical flood-susceptibility annotation for five cities; it does not
affect the network topology (OSMnx) or the comparative validity of the three strategies, which are
evaluated on the same network under identical conditions.

## 4. Provenance
`data_source` values in the CSV are **DSWD / PAGASA / NDRRMC** — the Philippine disaster-management
agencies. These are evacuation-simulation inputs; there is **no** classification, fake-news, or NLP
content anywhere in the project.
