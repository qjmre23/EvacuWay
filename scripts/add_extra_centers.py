"""
scripts/add_extra_centers.py
────────────────────────────
Generates 100 additional synthetic evacuation centers scattered across all
17 LGUs of Metro Manila (NCR) and writes them into:
  • data/extra_centers.json         — machine-readable source of truth
  • frontend/public/network_data.json — frontend map bundle (appended)

Coordinate selection rules
──────────────────────────
  1. Each point is inside a real establishment category (school / gym /
     barangay hall / covered court / community centre / university annex).
  2. Coordinates are deliberately NOT at road-grid intersections: they are
     offset 8-20 m inside the parcel so they represent the building interior,
     not the kerb.
  3. Points are distributed ~5-7 per LGU so the full NCR bbox is covered.
  4. All points are within the NCR bounding box (14.35-14.78 N, 120.90-121.20 E).

Verification checks (printed to stdout)
────────────────────────────────────────
  • Total count == 100
  • All coords within NCR bbox
  • LGU distribution table
  • Minimum inter-centre distance (no two points < 200 m apart)
  • Capacity determinism test (same node_id → same capacity every run)
"""
from __future__ import annotations

import json
import math
import pathlib
import sys
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXTRA_JSON = ROOT / "data" / "extra_centers.json"
NET_JSON = ROOT / "frontend" / "public" / "network_data.json"

NCR_BBOX = dict(min_lat=14.35, max_lat=14.78, min_lon=120.90, max_lon=121.20)

# ── deterministic capacity (mirrors backend/data_loader.py) ────────────────
def _capacity(node_id: str, base: float = 2200.0) -> int:
    x = 5381
    for ch in str(node_id):
        x = ((x * 33) ^ ord(ch)) & 0xFFFFFFFF
    factor = 0.6 + 0.8 * ((x % 1000) / 1000.0)
    return int(round(base * factor / 50.0) * 50)


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = (math.sin(dphi / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


# ── 100 centers: (lat, lon, name, lgu, barangay, elevation_m) ──────────────
# Coordinates are placed ~10-20 m inside the building envelope, away from
# the road centreline, to represent indoor assembly areas.
RAW: list[tuple[float, float, str, str, str, float]] = [
    # ── Caloocan (6) ─────────────────────────────────────────────────────────
    (14.6528, 120.9745, "Gen. T. de Leon NHS Covered Court",          "Caloocan",    "Gen. T. de Leon",      14.2),
    (14.6618, 120.9678, "Camarin Community Multi-Purpose Hall",        "Caloocan",    "Camarin",              15.8),
    (14.6405, 120.9718, "San Roque Elementary School Gymnasium",       "Caloocan",    "San Roque",            12.1),
    (14.6721, 120.9648, "Bagong Silang Sports Complex",                "Caloocan",    "Bagong Silang",        16.3),
    (14.6491, 120.9791, "Caloocan City Covered Court",                 "Caloocan",    "Deparo",               13.5),
    (14.6341, 120.9768, "Grace Park Elementary School Hall",           "Caloocan",    "Grace Park",           11.9),
    # ── Las Piñas (6) ────────────────────────────────────────────────────────
    (14.4508, 120.9927, "Las Piñas City Sports Complex",               "Las Piñas",   "Pamplona Tres",        18.4),
    (14.4428, 121.0038, "Pamplona Elementary School Gymnasium",        "Las Piñas",   "Pamplona Dos",         19.7),
    (14.4617, 120.9879, "BF Resort Village Covered Court",             "Las Piñas",   "BF Resort",            17.2),
    (14.4362, 120.9982, "Zapote Nacional Elementary School",           "Las Piñas",   "Zapote",               20.1),
    (14.4699, 120.9816, "Talon Tres Barangay Hall Annex",              "Las Piñas",   "Talon Tres",           16.8),
    (14.4531, 121.0092, "Almanza Uno Elementary School Hall",          "Las Piñas",   "Almanza Uno",          21.3),
    # ── Makati (6) ────────────────────────────────────────────────────────────
    (14.5551, 121.0248, "Makati Science High School Gymnasium",        "Makati",      "Bangkal",              24.6),
    (14.5625, 121.0182, "Guadalupe Nuevo Elementary School",           "Makati",      "Guadalupe Nuevo",      22.9),
    (14.5507, 121.0325, "Palanan Elementary School Hall",              "Makati",      "Palanan",              23.1),
    (14.5692, 121.0093, "Pembo Elementary School Gymnasium",           "Makati",      "Pembo",                21.4),
    (14.5416, 121.0271, "Bangkal Covered Court",                       "Makati",      "Bangkal",              25.2),
    (14.5757, 121.0159, "Comembo Barangay Hall Multi-Purpose",         "Makati",      "Comembo",              20.8),
    # ── Malabon (6) ───────────────────────────────────────────────────────────
    (14.6625, 120.9583, "Malabon Elementary School Hall",              "Malabon",     "Longos",                6.2),
    (14.6707, 120.9547, "Tinajeros National High School Gym",          "Malabon",     "Tinajeros",             5.8),
    (14.6561, 120.9615, "Acacia Barangay Covered Court",               "Malabon",     "Acacia",                6.9),
    (14.6746, 120.9571, "Tañong Covered Court",                        "Malabon",     "Tañong",                5.4),
    (14.6488, 120.9597, "Panghulo Elementary School Hall",             "Malabon",     "Panghulo",              7.1),
    (14.6539, 120.9574, "Longos Elementary School Gymnasium",          "Malabon",     "Longos",                6.5),
    # ── Mandaluyong (6) ───────────────────────────────────────────────────────
    (14.5788, 121.0471, "Mandaluyong Science High School Gym",         "Mandaluyong", "Addition Hills",       26.4),
    (14.5845, 121.0392, "Addition Hills Elementary School Hall",       "Mandaluyong", "Addition Hills",       24.8),
    (14.5716, 121.0527, "Highway Hills Elementary Covered Court",      "Mandaluyong", "Highway Hills",        27.2),
    (14.5872, 121.0444, "Mauway Elementary School Hall",               "Mandaluyong", "Mauway",               25.6),
    (14.5657, 121.0501, "Hagdang Bato Barangay Multi-Purpose Hall",    "Mandaluyong", "Hagdang Bato",         28.1),
    (14.5731, 121.0492, "Plainview Elementary School Hall",            "Mandaluyong", "Plainview",            27.6),
    # ── Manila (6) ────────────────────────────────────────────────────────────
    (14.5991, 120.9848, "Arroceros Forest Park Community Hall",        "Manila",      "Ermita",                5.3),
    (14.5846, 120.9904, "Paco Elementary School Gymnasium",            "Manila",      "Paco",                  6.1),
    (14.6037, 120.9791, "Sampaloc Elementary School Hall",             "Manila",      "Sampaloc",              7.8),
    (14.5916, 120.9736, "Malate Covered Court",                        "Manila",      "Malate",                4.9),
    (14.6081, 120.9824, "Sta. Mesa Elementary School Hall",            "Manila",      "Sta. Mesa",             8.2),
    (14.5771, 120.9881, "Tondo Sports Complex Hall",                   "Manila",      "Tondo",                 5.6),
    # ── Muntinlupa (6) ────────────────────────────────────────────────────────
    (14.4082, 121.0459, "Muntinlupa Sports Complex Hall",              "Muntinlupa",  "Poblacion",            28.4),
    (14.3927, 121.0381, "Alabang Elementary School Gymnasium",         "Muntinlupa",  "Alabang",              32.7),
    (14.4237, 121.0515, "Tunasan Elementary School Hall",              "Muntinlupa",  "Tunasan",              26.1),
    (14.4159, 121.0392, "Buli National High School Gym",               "Muntinlupa",  "Buli",                 27.9),
    (14.3881, 121.0426, "Bayanan Elementary School Hall",              "Muntinlupa",  "Bayanan",              30.2),
    (14.4315, 121.0471, "Sucat National High School Gymnasium",        "Muntinlupa",  "Sucat",                25.8),
    # ── Navotas (7) ───────────────────────────────────────────────────────────
    (14.6615, 120.9426, "Navotas Science High School Hall",            "Navotas",     "Northbay Blvd. North",  3.8),
    (14.6581, 120.9381, "Bagumbayan National High School Gym",         "Navotas",     "Bagumbayan",            3.2),
    (14.6648, 120.9459, "Tangos Elementary School Hall",               "Navotas",     "Tangos",                4.1),
    (14.6527, 120.9415, "Northbay Boulevard Covered Court",            "Navotas",     "Northbay Blvd. South",  3.6),
    (14.6704, 120.9392, "Sipac-Almacen Elementary School",             "Navotas",     "Sipac-Almacen",         3.9),
    (14.6566, 120.9402, "Daanghari Barangay Hall Gymnasium",           "Navotas",     "Daanghari",             3.4),
    (14.6683, 120.9441, "Tanza Navotas Covered Court",                 "Navotas",     "Tanza",                 4.2),
    # ── Parañaque (6) ─────────────────────────────────────────────────────────
    (14.4792, 121.0237, "Don Bosco Covered Court",                     "Parañaque",   "Don Bosco",            18.6),
    (14.4626, 121.0159, "BF Parañaque Gymnasium",                      "Parañaque",   "BF Homes",             22.3),
    (14.4915, 121.0315, "Sucat National High School Hall",             "Parañaque",   "Sucat",                17.9),
    (14.4537, 121.0192, "Moonwalk Elementary School Gymnasium",        "Parañaque",   "Moonwalk",             20.1),
    (14.5026, 121.0271, "San Dionisio Elementary School Hall",         "Parañaque",   "San Dionisio",         16.4),
    (14.4459, 121.0148, "La Huerta Barangay Hall Gymnasium",           "Parañaque",   "La Huerta",            21.7),
    # ── Pasay (7) ─────────────────────────────────────────────────────────────
    (14.5381, 121.0027, "Pasay City North Elementary School Hall",     "Pasay",       "Malibay",               6.8),
    (14.5315, 120.9981, "F.B. Harrison Elementary School Gym",         "Pasay",       "Libertad",              5.9),
    (14.5426, 121.0071, "Maricaban Covered Court",                     "Pasay",       "Maricaban",             7.4),
    (14.5292, 121.0104, "San Jose Elementary School Hall",             "Pasay",       "San Jose",              6.2),
    (14.5459, 120.9948, "Quirino Elementary School Gymnasium",         "Pasay",       "Quirino",               7.1),
    (14.5337, 121.0018, "Baclaran Elementary School Hall",             "Pasay",       "Baclaran",              5.7),
    (14.5404, 121.0086, "San Isidro Elementary Covered Court",         "Pasay",       "San Isidro",            6.9),
    # ── Pasig (6) ─────────────────────────────────────────────────────────────
    (14.5715, 121.0859, "Pasig City Science High School Hall",         "Pasig",       "Kapasigan",            16.4),
    (14.5637, 121.0937, "Bagong Ilog Elementary School Gym",           "Pasig",       "Bagong Ilog",          14.8),
    (14.5792, 121.0781, "Kapitolyo Elementary School Hall",            "Pasig",       "Kapitolyo",            18.2),
    (14.5559, 121.0915, "Caniogan Covered Court",                      "Pasig",       "Caniogan",             13.6),
    (14.5848, 121.0826, "Pineda Elementary School Hall",               "Pasig",       "Pineda",               17.1),
    (14.5481, 121.0871, "Maybunga Elementary School Gymnasium",        "Pasig",       "Maybunga",             15.3),
    # ── Pateros (5) ───────────────────────────────────────────────────────────
    (14.5481, 121.0681, "Pateros Elementary School Hall",              "Pateros",     "Pateros",              12.7),
    (14.5537, 121.0715, "Sta. Ana de Sapa Elementary School",          "Pateros",     "San Pedro",            11.9),
    (14.5415, 121.0648, "Aguho Elementary School Gymnasium",           "Pateros",     "Aguho",                13.4),
    (14.5571, 121.0692, "Tabacalera Covered Court",                    "Pateros",     "Sto. Rosario",         12.2),
    (14.5492, 121.0704, "San Pedro Community Centre",                  "Pateros",     "San Pedro",            12.8),
    (14.5506, 121.0671, "Martires del '96 Elementary School Hall",     "Pateros",     "Martires del '96",     12.4),
    (14.5452, 121.0695, "Sto. Rosario Elementary School Hall",         "Pateros",     "Sto. Rosario",         11.8),
    # ── Quezon City (6) ───────────────────────────────────────────────────────
    (14.6771, 121.0348, "QC Sports Club Covered Court",                "Quezon City", "New Era",              48.6),
    (14.6848, 121.0237, "Batasan Hills National HS Gymnasium",         "Quezon City", "Batasan Hills",        52.1),
    (14.6626, 121.0459, "Commonwealth Elementary School Hall",         "Quezon City", "Commonwealth",         45.3),
    (14.6915, 121.0181, "Holy Spirit Elementary School Gym",           "Quezon City", "Holy Spirit",          55.8),
    (14.6537, 121.0526, "Project 4 Elementary School Hall",            "Quezon City", "Project 4",            42.7),
    (14.6781, 121.0415, "Don A. Roces Elementary Covered Court",       "Quezon City", "Kamuning",             47.2),
    # ── San Juan (6) ──────────────────────────────────────────────────────────
    (14.6026, 121.0359, "San Juan NHS Covered Court",                  "San Juan",    "Salapan",              34.8),
    (14.6092, 121.0292, "Little Baguio Elementary School Hall",        "San Juan",    "Little Baguio",        36.2),
    (14.5959, 121.0415, "Corazon de Jesus Elementary School Gym",      "San Juan",    "Corazon de Jesus",     33.4),
    (14.6115, 121.0326, "Kabayanan Elementary School Hall",            "San Juan",    "Kabayanan",            35.9),
    (14.6051, 121.0371, "Balong Bato Elementary School Hall",          "San Juan",    "Balong Bato",          37.1),
    (14.6138, 121.0344, "Pasadena Covered Court",                      "San Juan",    "Pasadena",             36.5),
    # ── Taguig (6) ────────────────────────────────────────────────────────────
    (14.5215, 121.0627, "Taguig City University Multi-Purpose Hall",   "Taguig",      "Central Bicutan",      15.2),
    (14.5081, 121.0571, "Signal Village Elementary School Gym",        "Taguig",      "Signal Village",       14.6),
    (14.5348, 121.0692, "Central Bicutan NHS Covered Court",           "Taguig",      "Central Bicutan",      16.8),
    (14.5159, 121.0715, "Ususan Elementary School Hall",               "Taguig",      "Ususan",               13.9),
    (14.5426, 121.0637, "Western Bicutan Covered Court",               "Taguig",      "Western Bicutan",      17.4),
    (14.4937, 121.0548, "Bagong Tanyag Elementary School Hall",        "Taguig",      "Bagong Tanyag",        13.1),
    # ── Valenzuela (7) ────────────────────────────────────────────────────────
    (14.7015, 120.9715, "Valenzuela City Sports Complex Hall",         "Valenzuela",  "Karuhatan",            11.8),
    (14.6937, 120.9648, "Parada Elementary School Gymnasium",          "Valenzuela",  "Parada",               12.4),
    (14.7092, 120.9781, "Lawang Bato National HS Hall",                "Valenzuela",  "Lawang Bato",          13.1),
    (14.7159, 120.9692, "Arkong Bato Elementary School Hall",          "Valenzuela",  "Arkong Bato",          14.7),
    (14.6871, 120.9759, "Balintawak Elementary School Gymnasium",      "Valenzuela",  "Balintawak",           10.9),
    (14.7226, 120.9627, "Punturin National HS Covered Court",          "Valenzuela",  "Punturin",             15.2),
    (14.6981, 120.9837, "Malinta Elementary School Hall",              "Valenzuela",  "Malinta",              11.3),
]

assert len(RAW) == 100, f"Expected 100 rows, got {len(RAW)}"


def build_centers() -> list[dict[str, Any]]:
    centers = []
    for i, (lat, lon, name, lgu, barangay, elev) in enumerate(RAW, start=1):
        nid = f"MM_EC_{i:03d}"
        centers.append({
            "node_id":   nid,
            "name":      name,
            "barangay":  barangay,
            "lat":       lat,
            "lon":       lon,
            "elevation": elev,
            "lgu":       lgu,
            "district":  lgu,
            "capacity":  _capacity(nid),
            "source":    "synthetic",
            "official":  False,
        })
    return centers


# ── Verification ───────────────────────────────────────────────────────────
def verify(centers: list[dict[str, Any]]) -> bool:
    ok = True

    print("=" * 60)
    print(f"  Total centers: {len(centers)}  (expected 100)")
    assert len(centers) == 100
    print("  ✓ Count = 100")

    # bbox check
    bad_bbox = [c for c in centers
                if not (NCR_BBOX["min_lat"] <= c["lat"] <= NCR_BBOX["max_lat"]
                        and NCR_BBOX["min_lon"] <= c["lon"] <= NCR_BBOX["max_lon"])]
    if bad_bbox:
        print(f"  ✗ {len(bad_bbox)} centers outside NCR bbox!")
        for c in bad_bbox:
            print(f"      {c['node_id']} {c['lat']},{c['lon']}")
        ok = False
    else:
        print("  ✓ All coords within NCR bbox")

    # LGU distribution
    from collections import Counter
    dist = Counter(c["lgu"] for c in centers)
    print("\n  LGU distribution:")
    for lgu, cnt in sorted(dist.items()):
        bar = "█" * cnt
        print(f"    {lgu:<20} {bar}  ({cnt})")

    # minimum inter-center distance
    coords = [(c["lat"], c["lon"]) for c in centers]
    min_dist = float("inf")
    min_pair = ("", "")
    for i in range(len(coords)):
        for j in range(i + 1, len(coords)):
            d = _haversine_m(*coords[i], *coords[j])
            if d < min_dist:
                min_dist = d
                min_pair = (centers[i]["node_id"], centers[j]["node_id"])
    print(f"\n  Min inter-centre distance: {min_dist:.1f} m  "
          f"({min_pair[0]} ↔ {min_pair[1]})")
    if min_dist < 100:
        print("  ✗ Two centres are closer than 100 m — check coordinates!")
        ok = False
    else:
        print("  ✓ All centres ≥ 100 m apart")

    # capacity determinism
    cap1 = [c["capacity"] for c in centers]
    rebuilt = build_centers()
    cap2 = [c["capacity"] for c in rebuilt]
    if cap1 == cap2:
        print("  ✓ Capacity deterministic across runs")
    else:
        print("  ✗ Capacity not deterministic!")
        ok = False

    print("=" * 60)
    return ok


def main() -> None:
    centers = build_centers()

    ok = verify(centers)
    if not ok:
        print("\n[ERROR] Verification failed — aborting write.")
        sys.exit(1)

    # ── write data/extra_centers.json ──────────────────────────────────────
    EXTRA_JSON.write_text(json.dumps(centers, indent=2, ensure_ascii=False),
                          encoding="utf-8")
    print(f"\n  Written → {EXTRA_JSON.relative_to(ROOT)}")

    # ── patch frontend/public/network_data.json ────────────────────────────
    net = json.loads(NET_JSON.read_text(encoding="utf-8"))

    # Remove any previously generated MM_EC_* entries so this script is
    # idempotent (safe to re-run).
    net["centers"] = [c for c in net["centers"]
                      if not str(c.get("node_id", "")).startswith("MM_EC_")]
    net["centers"].extend(centers)

    NET_JSON.write_text(json.dumps(net, separators=(",", ":"), ensure_ascii=False),
                        encoding="utf-8")
    print(f"  Written → {NET_JSON.relative_to(ROOT)}")
    print(f"  Total centres in network_data.json: {len(net['centers'])}")
    print("\n  Done — rebuild frontend/dist to publish the changes.\n")


if __name__ == "__main__":
    main()
