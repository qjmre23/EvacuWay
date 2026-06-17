# EvacuWay — Revised Parameter Table (Task 6)

Internally consistent simulation parameters. The contradictory **"150–500 nodes"** row is **removed**
and replaced by the network-scale model from [network_scale.md](network_scale.md).

## Network scale

| Parameter | Value |
|-----------|-------|
| Prototype seed nodes (Marikina XLSX) | 1,250 |
| Prototype edges (shipped k-NN graph) | ≈3,064 |
| Full Metro Manila graph (OSMnx) | ~80,000–150,000 nodes / ~200,000–400,000 edges |
| Thesis simulation sample (stratified) | ~5,000–15,000 nodes / ~12,000–35,000 edges |
| Origin Zones (prototype / full) | 381 / ~2,000–5,000 |
| Evacuation Centers (prototype / full) | 129 / ~300–500 |

## Routing & hazard

| Parameter | Symbol | Value |
|-----------|--------|-------|
| Routing strategies | — | A (Dijkstra), B (Frank-Wolfe), C (Zone-Sequential) |
| Flood severity levels | λF | Mild 0.33 / Moderate 0.66 / Severe 1.00 |
| Edge closure probability | — | fe · λF (Bernoulli) |
| Flood slowdown factor | — | 1 + 4·fe·λF on surviving flooded edges |
| Agent speed | — | 40 km/hr (20–60 range), BPR-adjusted |
| BPR parameters | α, β | 0.15, 4 |
| Evacuation-horizon capacity | — | capacity · 3 h |
| v/c clamp | — | 2.0 |

## Demand & shelter

| Parameter | Value |
|-----------|-------|
| Agents per Origin Zone | `evacuees`/`affected_population`, capped at 500 |
| Demand scale (prototype calibration) | 9.0 |
| Center shelter capacity | 2,200 agents ±40 % |
| Origin discharge rate | 40 veh/min |
| Completion window | 240 min |

## Experiment

| Parameter | Value |
|-----------|-------|
| Strategies × flood levels × seeds | 3 × 3 × 30 = **270 runs** |
| Seeds | fixed 42–71 |
| KPIs | TET, AET, ECR, NUI, EI (Gini), SCP |
| Statistics | one-way ANOVA + Tukey HSD, Cohen's f, partial η² |

All values are defined in `backend/config.py` and surfaced via `GET /api/meta`.
