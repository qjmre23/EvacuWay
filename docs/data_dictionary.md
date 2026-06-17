# EvacuWay — Data Dictionary (Task 4)

These are **evacuation-simulation datasets**, not classification datasets. There is no LIAR /
PolitiFact / fake-news / NLP variable anywhere.

## A. `metro_manila_flood_dataset.csv` — 2,200 records × 27 columns

Verified: 2,200 rows; 12 cities; years 2000–2024; flood depth 0.06–4.49 m; 55 uniquely named
evacuation centers; response time 0.5–24.0 h.

| # | Column | Type | Description | Observed range / values |
|---|--------|------|-------------|--------------------------|
| 1 | record_id | int | Unique record identifier | 1–2200 |
| 2 | incident_date | date | Incident date (YYYY-MM-DD) | 2000–2024 |
| 3 | year | int | Year | 2000–2024 |
| 4 | month | str | Month name | January–December |
| 5 | city_municipality | str | NCR city | 12 cities (see distribution below) |
| 6 | barangay | str | Barangay name | many |
| 7 | latitude | float | WGS84 latitude | 14.388–14.736 |
| 8 | longitude | float | WGS84 longitude | 120.936–121.132 |
| 9 | flood_risk_level | str | Risk class | Very High / High / Moderate / Low |
| 10 | flood_depth_meters | float | Peak flood depth | 0.06–4.49 |
| 11 | flood_category | str | Descriptive depth band | Ankle-deep … House-roof level |
| 12 | flood_duration_hours | int | Flood duration | — |
| 13 | rainfall_mm | float | Rainfall amount | — |
| 14 | weather_condition | str | Weather | Heavy Rain / Monsoon / Scattered Showers / … |
| 15 | typhoon_name | str | Typhoon or "None (Monsoon)" | Ondoy, Ulysses, Rolly, Pepito, Ursula, Quedan, Nonoy, Kiko, Tisoy, … |
| 16 | typhoon_alert_level | str | PAGASA signal | None / Signal No. 1–4 |
| 17 | affected_population | int | People affected | 200–7,999 |
| 18 | affected_families | int | Families displaced | — |
| 19 | evacuees | int | Evacuees | 4–3,540 |
| 20 | evacuation_center | str | Named center | 55 unique (schools/gyms/covered courts) |
| 21 | fatalities | int | Deaths | — |
| 22 | injuries | int | Injuries | — |
| 23 | estimated_damage_php | int | Economic damage (PHP) | — |
| 24 | infrastructure_damaged | str | Infrastructure type | Bridges and Roads / Roads and Homes / … |
| 25 | relief_goods_distributed | str | Relief distributed | Yes / No |
| 26 | response_time_hours | float | Hours until response | 0.5–24.0 |
| 27 | data_source | str | Provenance | DSWD / PAGASA / NDRRMC |

**City record distribution (12 cities):** Malabon 264, Marikina 258, Navotas 216, Valenzuela 215,
Pasig 215, Quezon City 215, Manila 215, Caloocan 172, Parañaque 129, Taguig 129, Las Piñas 86,
Muntinlupa 86.

**flood_risk_level distribution:** High 991, Very High 736, Moderate 430, Low 43.
**typhoon_alert_level distribution:** Signal No. 3 348, Signal No. 2 325, Signal No. 4 324, Signal No. 1 311.

## B. `Evacuation_Marikina_Dataset.xlsx` — 1,250 records × 10 columns

Verified: 1,250 rows; node types 740 Intersection / 381 Origin Zone / 129 Evacuation Center.

| # | Column | Type | Description |
|---|--------|------|-------------|
| 1 | Node ID | str | Unique node code (N001…N1250) |
| 2 | Date | date | Simulation date (YYYY-MM-DD) |
| 3 | Node Type | str | Intersection / Origin Zone / Evacuation Center |
| 4 | Barangay Name | str | Marikina barangay or facility name |
| 5 | Population Count | int | 0 for non-origins; up to ~3,000 for Origin Zones |
| 6 | Centroid Latitude | float | WGS84 latitude (≈14.52–14.68 N) |
| 7 | Centroid Longitude | float | WGS84 longitude (≈120.97–121.13 E) |
| 8 | Is Evacuation Center | str | Yes / No |
| 9 | Elevation (m asl) | float | Elevation above sea level |
| 10 | Notes | str | Facility name / risk annotation (e.g. "Low risk", "Moderate risk", "High risk") |

> **Schema note.** The original spec described an 11-column XLSX with a separate `Flood Risk Level`
> column. In the delivered file the **risk level is encoded inside `Notes`** ("Low risk",
> "Moderate risk", "High risk"); the loader parses it from there (`backend/data_loader.py::_node_risk`).
> Node-type breakdown matches the spec exactly: 740 (59.2 %) / 381 (30.5 %) / 129 (10.3 %).

See the column-to-simulation mapping in [dataset_mapping_table.md](dataset_mapping_table.md).
