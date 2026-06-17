import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import type { NetworkData, RouteGeom, Strategy } from "../types";

const STRAT_COLOR: Record<Strategy, string> = {
  A: "#2563eb",
  B: "#f59e0b",
  C: "#dc2626",
};

const RISK_COLOR: Record<string, string> = {
  "Very High": "#7f1d1d",
  High: "#dc2626",
  Moderate: "#f59e0b",
  Low: "#22c55e",
};

export interface LayerToggles {
  flood: boolean;
  centers: boolean;
  origins: boolean;
  routes: boolean;
}

interface Props {
  network: NetworkData;
  routes: RouteGeom[];
  strategy: Strategy;
  layers: LayerToggles;
}

export default function MapView({ network, routes, strategy, layers }: Props) {
  const { bbox } = network;
  const center: [number, number] = [
    (bbox.min_lat + bbox.max_lat) / 2,
    (bbox.min_lon + bbox.max_lon) / 2,
  ];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
              weight: 2,
              opacity: 0.55,
            }}
          />
        ))}

      {layers.origins &&
        network.origins.map((o) => (
          <CircleMarker
            key={o.node_id}
            center={[o.lat, o.lon]}
            radius={3}
            pathOptions={{ color: "#fb923c", fillColor: "#fb923c", fillOpacity: 0.8, weight: 1 }}
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
        network.centers.map((c) => (
          <CircleMarker
            key={c.node_id}
            center={[c.lat, c.lon]}
            radius={5}
            pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.95, weight: 1.5 }}
          >
            <Popup>
              <b>Evacuation center</b>
              <br />
              {c.name || c.barangay}
              <br />
              Elevation: {c.elevation} m asl
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
