"""
EvacuWay — live PAGASA rainfall enrichment.

Fetches recent rainfall readings from PAGASA automatic weather stations
(panahon.gov.ph) and exposes them for the dashboard's "PAGASA live rainfall"
layer and sidebar card. Live rainfall optionally enriches per-edge flood
susceptibility (heavier rainfall → higher fe) in future runs.

The public PAGASA feed is best-effort and may be unreachable, rate-limited, or
change shape. Every failure degrades gracefully to ``stations=[], live=False``
so the API and dashboard keep working offline (the frontend then falls back to
the bundled ``sample_rainfall.json``). Set ``PAGASA_RAINFALL_URL`` in the
environment to point at the JSON feed for your deployment.
"""
from __future__ import annotations

import json
import os
import time
import urllib.request
from typing import Any

# Default station JSON feed. Override with the env var for your environment.
PAGASA_RAINFALL_URL = os.getenv("PAGASA_RAINFALL_URL", "https://panahon.gov.ph/api/stations")
_HTTP_TIMEOUT = float(os.getenv("PAGASA_TIMEOUT", "6"))

# Short in-process cache so polling clients don't hammer the upstream feed.
_CACHE: dict[str, Any] = {"ts": 0.0, "data": None}
_CACHE_TTL = 60.0


def _empty(reason: str) -> dict[str, Any]:
    return {"stations": [], "live": False, "source": reason}


def _parse(raw: Any) -> list[dict[str, Any]]:
    """Best-effort normalisation of an upstream payload into station dicts.

    Accepts a list of records or a ``{"stations": [...]}`` wrapper and pulls the
    common name / lat / lon / rainfall fields under several likely key spellings.
    """
    records = raw.get("stations", raw) if isinstance(raw, dict) else raw
    if not isinstance(records, list):
        return []
    out: list[dict[str, Any]] = []
    for r in records:
        if not isinstance(r, dict):
            continue
        name = r.get("name") or r.get("station") or r.get("station_name")
        lat = r.get("lat") or r.get("latitude")
        lon = r.get("lon") or r.get("lng") or r.get("longitude")
        rain = (r.get("rainfall_mm_hr") or r.get("rainfall") or r.get("rain")
                or r.get("rr") or 0)
        if name is None or lat is None or lon is None:
            continue
        try:
            out.append({
                "name": str(name),
                "lat": float(lat),
                "lon": float(lon),
                "rainfall_mm_hr": round(float(rain), 1),
                "observed_at": r.get("observed_at") or r.get("timestamp"),
            })
        except (TypeError, ValueError):
            continue
    return out


def get_rainfall(force: bool = False) -> dict[str, Any]:
    """Return ``{stations, live, source, observed_at}``; never raises."""
    now = time.time()
    if not force and _CACHE["data"] is not None and now - _CACHE["ts"] < _CACHE_TTL:
        return _CACHE["data"]

    data = _empty("unavailable")
    try:
        req = urllib.request.Request(
            PAGASA_RAINFALL_URL,
            headers={"User-Agent": "EvacuWay/2.0 (thesis dashboard)"},
        )
        with urllib.request.urlopen(req, timeout=_HTTP_TIMEOUT) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
        stations = _parse(raw)
        if stations:
            data = {
                "stations": stations[:24],
                "live": True,
                "source": "panahon.gov.ph",
                "observed_at": time.strftime("%H:%M:%S"),
            }
    except Exception:
        data = _empty("unavailable")

    _CACHE["ts"] = now
    _CACHE["data"] = data
    return data
