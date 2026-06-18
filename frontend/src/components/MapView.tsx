import { useEffect } from "react";
import { latLngBounds } from "leaflet";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { NetworkData, RainfallStation, RouteGeom, Strategy } from "../types";

// Pans / zooms the map to the currently visible points whenever the city filter
// changes (focusKey). When the filter is cleared it resets to the default view.
function FitBounds({
  points,
  focusKey,
  defaultCenter,
  defaultZoom,
}: {
  points: [number, number][];
  focusKey: string;
  defaultCenter: [number, number];
  defaultZoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusKey) {
      map.setView(defaultCenter, defaultZoom, { animate: true });
      return;
    }
    if (points.length > 0) {
      map.fitBounds(latLngBounds(points), { padding: [40, 40], maxZoom: 15, animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);
  return null;
}

const STRAT_COLOR: Record<Strategy, string> = {
  A: "#2563eb",
  B: "#f59e0b",
  C: "#dc2626",
};

// Per-strategy line style: A solid · B dashed · C dotted.
const STRAT_DASH: Record<Strategy, string | undefined> = {
  A: undefined,
  B: "10 7",
  C: "2 7",
};

const RISK_COLOR: Record<string, string> = {
  "Very High": "#7f1d1d",
  High: "#dc2626",
  Moderate: "#f59e0b",
  Low: "#22c55e",
};

const ORIGIN_COLOR = "#fb923c"; // orange
const CENTER_COLOR = "#22c55e"; // green
const CENTER_XLSX_COLOR = "#3b82f6"; // blue (prototype XLSX seed)
const RAIN_COLOR = "#8b5cf6"; // violet

function rainColor(mm: number): string {
  if (mm >= 15) return "#dc2626"; // intense
  if (mm >= 7.5) return "#f97316"; // heavy
  if (mm >= 2.5) return "#eab308"; // moderate
  return "#3b82f6"; // light
}

export interface LayerToggles {
  flood: boolean;
  centers: boolean;
  origins: boolean;
  routes: boolean;
  rainfall: boolean;
}

interface Props {
  network: NetworkData;
  routes: RouteGeom[];
  strategy: Strategy;
  layers: LayerToggles;
  rainfall?: RainfallStation[];
  focusKey?: string;
}

export default function MapView({ network, routes, strategy, layers, rainfall = [], focusKey = "" }: Props) {
  const { bbox } = network;
  // Centre on the actual network (evacuation centres / origins) so routes are
  // visible on load, falling back to the metro bbox midpoint if absent.
  const anchor = network.centers.length ? network.centers : network.origins;
  const center: [number, number] = anchor.length
    ? [
        anchor.reduce((s, c) => s + c.lat, 0) / anchor.length,
        anchor.reduce((s, c) => s + c.lon, 0) / anchor.length,
      ]
    : [(bbox.min_lat + bbox.max_lat) / 2, (bbox.min_lon + bbox.max_lon) / 2];
  const maxRain = Math.max(1, ...rainfall.map((r) => r.rainfall_mm_hr));

  // Points the filter zooms to (the currently visible nodes for the selected city).
  const focusPoints: [number, number][] = [
    ...network.centers.map((c) => [c.lat, c.lon] as [number, number]),
    ...network.origins.map((o) => [o.lat, o.lon] as [number, number]),
    ...network.floodPoints.map((p) => [p.lat, p.lon] as [number, number]),
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={focusPoints} focusKey={focusKey} defaultCenter={center} defaultZoom={13} />

      {layers.flood &&
        network.floodPoints.map((p, i) => (
          <CircleMarker
            key={`f${i}`}
            center={[p.lat, p.lon]}
            radius={4 + p.fe * 6}
            pathOptions={{
              color: RISK_COLOR[p.risk] ?? "#f59e0b",
              fillColor: RISK_COLOR[p.risk] ?? "#f59e0b",
              fillOpacity: 0.35,
              weight: 0.5,
            }}
          >
            <Popup>
              <b>{p.barangay}</b>, {p.city}
              <br />
              Risk: {p.risk} · Depth: {p.depth} m
            </Popup>
          </CircleMarker>
        ))}

      {layers.routes &&
        routes.map((r, i) => (
          <Polyline
            key={`r${i}`}
            positions={r.coords}
            pathOptions={{
              color: STRAT_COLOR[strategy],
              weight: strategy === "C" ? 3.5 : 3,
              opacity: 0.85,
              dashArray: STRAT_DASH[strategy],
              lineCap: "round",
            }}
          />
        ))}

      {/* Route endpoints — every route starts at an ORANGE origin and ends at a
          GREEN evacuation centre, drawn on top of the road-following line. */}
      {layers.routes &&
        routes.map((r, i) => {
          const start = r.coords[0];
          const end = r.coords[r.coords.length - 1];
          if (!start || !end) return null;
          return (
            <CircleMarker
              key={`rs${i}`}
              center={start}
              radius={4}
              pathOptions={{ color: "#7c2d12", fillColor: ORIGIN_COLOR, fillOpacity: 1, weight: 1 }}
            >
              <Popup>
                <b>Origin zone</b>
                <br />
                {r.population.toLocaleString()} people → evacuation centre
              </Popup>
            </CircleMarker>
          );
        })}
      {layers.routes &&
        routes.map((r, i) => {
          const end = r.coords[r.coords.length - 1];
          if (!end) return null;
          return (
            <CircleMarker
              key={`re${i}`}
              center={end}
              radius={5}
              pathOptions={{ color: "#14532d", fillColor: CENTER_COLOR, fillOpacity: 1, weight: 1.5 }}
            >
              <Popup>
                <b>Evacuation centre (route end)</b>
              </Popup>
            </CircleMarker>
          );
        })}

      {layers.rainfall &&
        rainfall.map((s, i) => (
          <CircleMarker
            key={`rain${i}`}
            center={[s.lat, s.lon]}
            radius={6 + 14 * (s.rainfall_mm_hr / maxRain)}
            pathOptions={{
              color: RAIN_COLOR,
              fillColor: rainColor(s.rainfall_mm_hr),
              fillOpacity: 0.45,
              weight: 1,
            }}
          >
            <Popup>
              <b>{s.name}</b>
              <br />
              PAGASA station · {s.rainfall_mm_hr.toFixed(1)} mm/h
            </Popup>
          </CircleMarker>
        ))}

      {layers.origins &&
        network.origins.map((o) => (
          <CircleMarker
            key={o.node_id}
            center={[o.lat, o.lon]}
            radius={3}
            pathOptions={{ color: ORIGIN_COLOR, fillColor: ORIGIN_COLOR, fillOpacity: 0.8, weight: 1 }}
          >
            <Popup>
              <b>Origin zone — {o.barangay}</b>
              <br />
              Population: {o.population.toLocaleString()}
              <br />
              Flood risk: {o.flood_risk}
            </Popup>
          </CircleMarker>
        ))}

      {layers.centers &&
        network.centers.map((c) => {
          const isCdra = c.source === "cdra";
          const official = c.official ?? isCdra;
          return (
            <CircleMarker
              key={c.node_id}
              center={[c.lat, c.lon]}
              radius={5}
              pathOptions={{
                color: official ? "#14532d" : "#1e3a8a",
                fillColor: official ? CENTER_COLOR : CENTER_XLSX_COLOR,
                fillOpacity: 0.95,
                weight: 1.5,
              }}
            >
              <Popup>
                <b>{c.name || c.barangay}</b>
                <br />
                {c.district || c.barangay}
                {c.capacity ? (
                  <>
                    <br />
                    Capacity: {c.capacity.toLocaleString()} persons
                  </>
                ) : null}
                <br />
                Elevation: {c.elevation} m asl
                <br />
                {isCdra ? "✓ Official QC CDRA 2023" : "Designated centre · Marikina dataset"}
              </Popup>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
