// API client for the EvacuWay backend, with graceful fallback to bundled
// static data so the dashboard renders even when the API is offline (e.g. in
// a static preview). No authentication is used anywhere.
import axios from "axios";
import type {
  FloodLevel,
  NetworkData,
  ResultsBundle,
  SimulateResponse,
  Strategy,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const http = axios.create({ baseURL: BASE_URL, timeout: 8000 });

export interface ApiHealth {
  online: boolean;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await http.get("/health", { timeout: 2500 });
    return r.data?.status === "ok";
  } catch {
    return false;
  }
}

export async function fetchNetwork(): Promise<NetworkData> {
  // Always prefer the bundled snapshot (fast + always available); the API
  // exposes the same data via /api/centers, /api/origins, /api/flood-points.
  const r = await fetch("/network_data.json");
  if (!r.ok) throw new Error("network_data.json missing");
  return (await r.json()) as NetworkData;
}

export async function fetchResults(): Promise<ResultsBundle> {
  try {
    const r = await http.get("/api/summary");
    return { summary: r.data, statistics: {} } as ResultsBundle;
  } catch {
    const r = await fetch("/sample_results.json");
    return (await r.json()) as ResultsBundle;
  }
}

interface SimulateArgs {
  strategy: Strategy;
  flood_level: FloodLevel;
  seed: number;
  city_subset?: string[] | null;
}

export async function simulate(args: SimulateArgs): Promise<SimulateResponse> {
  try {
    const r = await http.post("/api/simulate", {
      ...args,
      include_routes: true,
    });
    return { ...r.data, source: "api" } as SimulateResponse;
  } catch {
    // Fallback: bundled seed-42 routes for the chosen scenario.
    const r = await fetch("/sample_routes.json");
    const all = await r.json();
    const key = `${args.strategy}_${args.flood_level}`;
    const s = all[key];
    if (!s) throw new Error(`No bundled scenario for ${key}`);
    return {
      run_id: `${key}_42`,
      strategy: args.strategy,
      flood_level: args.flood_level,
      seed: 42,
      kpis: s.kpis,
      closed_edges: s.closed_edges,
      total_agents: s.total_agents,
      completed_agents: s.completed_agents,
      routes: s.routes,
      meta: {},
      source: "bundled",
    };
  }
}

export { BASE_URL };
