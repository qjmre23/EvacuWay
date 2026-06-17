"""
EvacuWay — central configuration.

All tunable constants and environment-driven paths live here. No secrets are
stored in code; optional API keys are read from the environment via python-dotenv.
"""
from __future__ import annotations

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # python-dotenv is optional at runtime
    pass

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

DATA_CSV_PATH = Path(os.getenv("DATA_CSV_PATH", DATA_DIR / "metro_manila_flood_dataset.csv"))
DATA_XLSX_PATH = Path(os.getenv("DATA_XLSX_PATH", DATA_DIR / "Evacuation_Marikina_Dataset.xlsx"))
GRAPH_CACHE_PATH = Path(os.getenv("GRAPH_CACHE_PATH", DATA_DIR / "metro_manila_graph.graphml"))
RESULTS_DIR = Path(os.getenv("RESULTS_DIR", DATA_DIR / "results"))
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------- #
# Simulation parameters
# --------------------------------------------------------------------------- #
SIMULATION_MAX_TICKS = int(os.getenv("SIMULATION_MAX_TICKS", "500"))
AGENT_SPEED_KMH = float(os.getenv("AGENT_SPEED_KMH", "40"))
AGENT_SPEED_M_PER_MIN = AGENT_SPEED_KMH * 1000.0 / 60.0  # metres per minute

# Per-origin agent cap for thesis-scale runs (Assumption #7).
MAX_AGENTS_PER_ZONE = int(os.getenv("MAX_AGENTS_PER_ZONE", "500"))

# Demand scaling applied to origin populations when assigning edge flows.
# Calibrates network saturation (mean volume/capacity) for the prototype graph.
DEMAND_SCALE = float(os.getenv("DEMAND_SCALE", "2.0"))

# Finite shelter capacity (agents) per evacuation centre. When nearby centres fill,
# demand spills to farther centres, lengthening routes and concentrating corridor
# load — which is what differentiates the three routing strategies.
CENTER_CAPACITY_BASE = float(os.getenv("CENTER_CAPACITY_BASE", "2200"))

# Surviving-but-flooded roads are slower: effective free time is multiplied by
# (1 + FLOOD_SLOWDOWN * fe * λF). This makes higher typhoon signals progressively
# degrade the network even on roads that are not fully closed.
FLOOD_SLOWDOWN = float(os.getenv("FLOOD_SLOWDOWN", "4.0"))

# Completion window (minutes): agents arriving after this are "not completed in time".
EVAC_WINDOW_MIN = float(os.getenv("EVAC_WINDOW_MIN", "240"))

# Queue discharge rate at an origin zone exit (vehicles per minute).
ORIGIN_DISCHARGE_PER_MIN = float(os.getenv("ORIGIN_DISCHARGE_PER_MIN", "40"))

# Reproducible seed list: 30 seeds (Assumption: fixed list 42..71).
SEEDS = list(range(42, 72))

STRATEGIES = ["A", "B", "C"]
FLOOD_LEVELS = ["mild", "moderate", "severe"]

# Severity multiplier λF applied to per-edge flood susceptibility (Bernoulli engine).
LAMBDA_F = {"mild": 0.33, "moderate": 0.66, "severe": 1.0}

# flood_risk_level -> fe (per-edge flood susceptibility). Assumption #3.
RISK_TO_FE = {
    "very high": 0.85,
    "high": 0.60,
    "moderate": 0.35,
    "low": 0.10,
}

# typhoon_alert_level -> λF context value (Assumption #2). Used in /api/meta and docs.
ALERT_TO_LAMBDA = {
    "none": 0.20,
    "none (monsoon)": 0.20,
    "signal no. 1": 0.33,
    "signal no. 2": 0.66,
    "signal no. 3": 0.85,
    "signal no. 4": 1.0,
}

# Road-class capacity (veh/hr) inferred from OSMnx highway tag. Assumption #8.
# In the prototype graph (no OSM tags) capacity is assigned by a deterministic
# length-based proxy that maps to these same classes.
ROAD_CAPACITY = {
    "residential": 400,
    "secondary": 800,
    "primary": 1500,
    "trunk": 2500,
}

# --------------------------------------------------------------------------- #
# Geography — WHOLE METRO MANILA (NCR) bounding box.
# (The Marikina XLSX is only a prototype sub-network seed.)
# --------------------------------------------------------------------------- #
METRO_MANILA_BBOX = {
    "min_lat": 14.35,
    "max_lat": 14.78,
    "min_lon": 120.90,
    "max_lon": 121.20,
}
METRO_MANILA_PLACE = "Metro Manila, Philippines"

# 17 LGUs of the NCR (study area).
NCR_LGUS = [
    "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Manila",
    "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig",
    "Pateros", "Quezon City", "San Juan", "Taguig", "Valenzuela",
]

# CSV covers 12 of 17 LGUs; these five have zero records (documented gap).
CSV_MISSING_LGUS = ["Makati", "Mandaluyong", "Pasay", "Pateros", "San Juan"]

# --------------------------------------------------------------------------- #
# CORS
# --------------------------------------------------------------------------- #
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173",
).split(",")
