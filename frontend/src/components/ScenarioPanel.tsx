import { useState } from "react";
import type { FloodLevel, Strategy } from "../types";

const STRATEGIES: { id: Strategy; name: string; desc: string }[] = [
  { id: "A", name: "A · Dijkstra", desc: "Shortest-path, decentralised" },
  { id: "B", name: "B · Frank-Wolfe", desc: "Capacity-aware, load-balanced" },
  { id: "C", name: "C · Zone-Sequential", desc: "Phased priority by flood risk" },
];

const FLOODS: { id: FloodLevel; label: string; lambda: string }[] = [
  { id: "mild", label: "Mild", lambda: "λF 0.33" },
  { id: "moderate", label: "Moderate", lambda: "λF 0.66" },
  { id: "severe", label: "Severe", lambda: "λF 1.00" },
];

interface Props {
  strategy: Strategy;
  flood: FloodLevel;
  seed: number;
  cities: string[];
  selectedCities: string[];
  running: boolean;
  apiOnline: boolean;
  onStrategy: (s: Strategy) => void;
  onFlood: (f: FloodLevel) => void;
  onSeed: (n: number) => void;
  onToggleCity: (c: string) => void;
  onRun: () => void;
}

export default function ScenarioPanel(p: Props) {
  const [showCities, setShowCities] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
          Routing strategy
        </h3>
        <div className="flex flex-col gap-2">
          {STRATEGIES.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 ${
                p.strategy === s.id
                  ? "border-sky-400 bg-sky-400/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <input
                type="radio"
                name="strategy"
                className="mt-1"
                checked={p.strategy === s.id}
                onChange={() => p.onStrategy(s.id)}
              />
              <span>
                <span className="block text-sm font-medium">{s.name}</span>
                <span className="block text-xs text-white/50">{s.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
          Flood severity
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {FLOODS.map((f) => (
            <button
              key={f.id}
              className={`btn flex flex-col items-center ${
                p.flood === f.id
                  ? "bg-sky-500 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
              onClick={() => p.onFlood(f.id)}
            >
              <span>{f.label}</span>
              <span className="text-[10px] opacity-70">{f.lambda}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <button
          className="mb-1 flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wide text-white/70"
          onClick={() => setShowCities((v) => !v)}
        >
          <span>City filter ({p.selectedCities.length || "all"})</span>
          <span>{showCities ? "▾" : "▸"}</span>
        </button>
        {showCities && (
          <div className="mt-2 grid max-h-40 grid-cols-2 gap-1 overflow-y-auto scroll-thin">
            {p.cities.map((c) => (
              <label key={c} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={p.selectedCities.includes(c)}
                  onChange={() => p.onToggleCity(c)}
                />
                {c}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-white/70">
          Seed
        </label>
        <input
          type="number"
          value={p.seed}
          onChange={(e) => p.onSeed(parseInt(e.target.value || "42", 10))}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm"
        />
      </div>

      <button
        onClick={p.onRun}
        disabled={p.running}
        className="btn w-full bg-emerald-500 py-3 text-base font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
      >
        {p.running ? "Simulating…" : "▶ Run simulation"}
      </button>

      <p className="text-center text-[11px] text-white/40">
        {p.apiOnline ? "● Live API connected" : "○ API offline — bundled results"}
      </p>
    </div>
  );
}
