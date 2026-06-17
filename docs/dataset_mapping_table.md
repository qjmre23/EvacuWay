# EvacuWay — Dataset → Simulation Mapping (Task 4)

How each dataset column drives the simulation. Implemented in `backend/data_loader.py` and
`backend/simulation.py`.

## Column-to-simulation mapping

```
flood_risk_level + flood_depth_meters  → fe   (per-edge flood susceptibility)
typhoon_alert_level                    → λF   (severity multiplier)
affected_population + evacuees          → agent count per Origin Zone
evacuation_center                      → destination node candidates
latitude + longitude                   → OSMnx origin/center node matching
response_time_hours                    → TET / AET validation benchmark
```

## fe mapping (flood_risk_level → per-edge susceptibility)

| flood_risk_level | fe |
|------------------|----|
| Very High | 0.85 |
| High | 0.60 |
| Moderate | 0.35 |
| Low | 0.10 |

Edge fe = mean of its two endpoint susceptibilities. Closure probability per edge = **fe · λF**
(Bernoulli engine). Surviving flooded edges are slowed by `1 + FLOOD_SLOWDOWN · fe · λF`.

## λF mapping (typhoon_alert_level → severity multiplier)

| typhoon_alert_level | λF (context) | Simulation level |
|---------------------|--------------|------------------|
| None / None (Monsoon) | 0.20 | — |
| Signal No. 1 | 0.33 | **Mild** |
| Signal No. 2 | 0.66 | **Moderate** |
| Signal No. 3 | 0.85 | (between) |
| Signal No. 4 | 1.00 | **Severe** |

The three simulated levels (Mild 0.33, Moderate 0.66, Severe 1.0) bracket the PAGASA signal scale.

## Which file drives which part

| Simulation element | Driven by | File |
|--------------------|-----------|------|
| Graph nodes/edges (prototype) | Node ID, Centroid Lat/Lon, Node Type | XLSX |
| Graph nodes/edges (full) | OSMnx drive network | OpenStreetMap |
| Per-edge flood susceptibility fe | flood_risk_level / Notes risk | CSV (+ XLSX) |
| Origin-zone agent counts | affected_population, evacuees / Population Count | CSV (+ XLSX) |
| Evacuation-center destinations | evacuation_center / Is Evacuation Center | CSV (+ XLSX) |
| Severity multiplier λF | typhoon_alert_level | CSV |
| KPI validation benchmark | response_time_hours | CSV |

**Source-of-truth note:** both files are evacuation-simulation datasets. Neither is a classification
dataset; there is no LIAR/PolitiFact/NLP content.
