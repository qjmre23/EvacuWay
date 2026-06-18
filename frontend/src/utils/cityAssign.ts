// Display-only helper: assign an NCR city to any lat/lon by nearest labelled
// flood-incident point. The flood dataset carries a `city` field for all 12
// covered NCR cities, so this gives every map element (origin, evacuation
// centre, route endpoint) a city label WITHOUT touching the simulation graph
// or any routing logic. Used purely to power the city filter on the map.
import type { FloodPoint } from "../types";

export type CityResolver = (lat: number, lon: number) => string;

export function makeCityResolver(points: FloodPoint[]): CityResolver {
  const pts = (points || []).filter((p) => p && p.city);
  if (pts.length === 0) return () => "";
  // Pre-extract into flat arrays for a tight nearest-neighbour loop.
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const cities = pts.map((p) => p.city);
  return (lat: number, lon: number) => {
    let best = cities[0];
    let bestD = Infinity;
    for (let i = 0; i < lats.length; i++) {
      const dx = lat - lats[i];
      const dy = lon - lons[i];
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = cities[i];
      }
    }
    return best;
  };
}
