import type { KPIs } from "../types";

const DEFS: { key: keyof KPIs; label: string; unit: string; hint: string; better: "low" | "high" }[] =
  [
    { key: "TET", label: "Total Evac. Time", unit: "min", hint: "Last agent arrives", better: "low" },
    { key: "AET", label: "Avg Evac. Time", unit: "min", hint: "Mean clearance", better: "low" },
    { key: "ECR", label: "Completion Rate", unit: "%", hint: "Reached in window", better: "high" },
    { key: "NUI", label: "Network Utilisation", unit: "", hint: "Mean load / capacity", better: "low" },
    { key: "EI", label: "Equity Index", unit: "Gini", hint: "0 = most equitable", better: "low" },
    { key: "SCP", label: "Survival %", unit: "%", hint: "Not trapped", better: "high" },
  ];

interface Props {
  kpis: KPIs | null;
  baseline?: KPIs | null;
}

export default function KpiCards({ kpis, baseline }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {DEFS.map((d) => {
        const v = kpis ? kpis[d.key] : null;
        const b = baseline ? baseline[d.key] : null;
        let delta: number | null = null;
        if (v != null && b != null && b !== 0) delta = ((v - b) / b) * 100;
        const good =
          delta == null
            ? null
            : d.better === "low"
            ? delta < 0
            : delta > 0;
        return (
          <div key={d.key} className="card">
            <div className="text-[11px] uppercase tracking-wide text-white/50">{d.label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums">
                {v == null ? "—" : v.toLocaleString()}
              </span>
              <span className="text-xs text-white/40">{d.unit}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-white/40">{d.hint}</span>
              {delta != null && (
                <span
                  className={`text-[11px] font-medium ${
                    good ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
