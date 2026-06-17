import { useState } from "react";
import { simulate } from "../api/client";
import type { FloodLevel, RunRecord, SimulateResponse, Strategy } from "../types";

export function useSimulation() {
  const [current, setCurrent] = useState<SimulateResponse | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(args: {
    strategy: Strategy;
    flood_level: FloodLevel;
    seed: number;
    city_subset?: string[] | null;
  }) {
    setRunning(true);
    setError(null);
    try {
      const res = await simulate(args);
      setCurrent(res);
      setHistory((h) => [
        {
          run_id: res.run_id,
          strategy: res.strategy,
          flood_level: res.flood_level,
          seed: res.seed,
          kpis: res.kpis,
          source: res.source ?? "api",
        },
        ...h.filter((r) => r.run_id !== res.run_id),
      ].slice(0, 24));
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
      return null;
    } finally {
      setRunning(false);
    }
  }

  return { current, history, running, error, run };
}
