import { useEffect, useState } from "react";
import { fetchRainfall } from "../api/client";
import type { RainfallData } from "../types";

// Polls the PAGASA rainfall feed (live backend, else bundled sample) so the
// header badge, map layer and sidebar card stay current.
export function useRainfall(intervalMs = 60_000) {
  const [data, setData] = useState<RainfallData>({ stations: [], live: false, source: "loading" });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const d = await fetchRainfall();
      if (alive) setData(d);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return data;
}
