// Shared TypeScript interfaces for the EvacuWay dashboard.

export type Strategy = "A" | "B" | "C";
export type FloodLevel = "mild" | "moderate" | "severe";

export interface KPIs {
  TET: number; // Total Evacuation Time (min)
  AET: number; // Average Evacuation Time (min)
  ECR: number; // Evacuation Completion Rate (%)
  NUI: number; // Network Utilization Index (ratio)
  EI: number; // Equity Index (Gini 0-1)
  SCP: number; // Survival Completion Percentage (%)
}

export interface RouteGeom {
  origin: string;
  destination: string;
  population: number;
  coords: [number, number][];
}

export interface SimulateResponse {
  run_id: string;
  strategy: Strategy;
  flood_level: FloodLevel;
  seed: number;
  kpis: KPIs;
  closed_edges: number;
  total_agents: number;
  completed_agents: number;
  routes: RouteGeom[];
  meta: Record<string, unknown>;
  source?: "api" | "bundled";
}

export interface Center {
  node_id: string;
  name: string;
  barangay: string;
  lat: number;
  lon: number;
  elevation: number;
  district?: string;
  capacity?: number;
  source?: "cdra" | "xlsx";
  official?: boolean;
}

export interface Origin {
  node_id: string;
  barangay: string;
  population: number;
  lat: number;
  lon: number;
  flood_risk: string;
}

export interface FloodPoint {
  lat: number;
  lon: number;
  risk: string;
  depth: number;
  fe: number;
  city: string;
  barangay: string;
}

export interface NetworkData {
  centers: Center[];
  origins: Origin[];
  floodPoints: FloodPoint[];
  bbox: { min_lat: number; max_lat: number; min_lon: number; max_lon: number };
  graph: Record<string, unknown>;
  meta: { study_area: string; ncr_lgus: string[]; csv_missing_lgus: string[] };
}

export interface SummaryCell {
  strategy: Strategy;
  flood_level: FloodLevel;
  n: number;
  TET: number;
  AET: number;
  ECR: number;
  NUI: number;
  EI: number;
  SCP: number;
  [k: string]: number | string;
}

export interface ResultsBundle {
  summary: { cells: SummaryCell[]; n_runs: number; kpis: string[] };
  statistics: Record<string, unknown>;
  generated_at?: string;
  n_runs?: number;
}

export interface RainfallStation {
  name: string;
  lat: number;
  lon: number;
  rainfall_mm_hr: number;
  observed_at?: string;
}

export interface RainfallData {
  stations: RainfallStation[];
  live: boolean;
  source: string;
  observed_at?: string;
}

export interface RunRecord {
  run_id: string;
  strategy: Strategy;
  flood_level: FloodLevel;
  seed: number;
  kpis: KPIs;
  source: "api" | "bundled";
}
