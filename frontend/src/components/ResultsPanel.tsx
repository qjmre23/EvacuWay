import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend as RLegend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResultsBundle, RunRecord, SummaryCell } from "../types";

const FLOODS = ["mild", "moderate", "severe"] as const;
const STRATS = ["A", "B", "C"] as const;
const COLORS: Record<string, string> = { A: "#2563eb", B: "#f59e0b", C: "#dc2626" };

function tetByFlood(cells: SummaryCell[]) {
  return FLOODS.map((f) => {
    const row: Record<string, number | string> = { flood: f };
    STRATS.forEach((s) => {
      const c = cells.find((x) => x.strategy === s && x.flood_level === f);
      row[s] = c ? c.TET : 0;
    });
    return row;
  });
}

function ecrByFlood(cells: SummaryCell[]) {
  return FLOODS.map((f) => {
    const row: Record<string, number | string> = { flood: f };
    STRATS.forEach((s) => {
      const c = cells.find((x) => x.strategy === s && x.flood_level === f);
      row[s] = c ? c.ECR : 0;
    });
    return row;
  });
}

interface Props {
  results: ResultsBundle | null;
  history: RunRecord[];
}

export default function ResultsPanel({ results, history }: Props) {
  const cells = results?.summary?.cells ?? [];
  const tet = tetByFlood(cells);
  const ecr = ecrByFlood(cells);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-white/80">
            Total Evacuation Time by strategy ({results?.summary?.n_runs ?? 0}-run mean)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tet}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="flood" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} unit="m" />
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #ffffff22" }} />
              <RLegend />
              {STRATS.map((s) => (
                <Bar key={s} dataKey={s} fill={COLORS[s]} name={`Strategy ${s}`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-white/80">
            Completion Rate vs flood severity
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ecr}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis dataKey="flood" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} unit="%" domain={[80, 100]} />
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #ffffff22" }} />
              <RLegend />
              {STRATS.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={COLORS[s]}
                  strokeWidth={2}
                  name={`Strategy ${s}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="mb-2 text-sm font-semibold text-white/80">Run history</h3>
        {history.length === 0 ? (
          <p className="text-xs text-white/40">No runs yet — press “Run simulation”.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-white/50">
              <tr>
                <th className="py-1 pr-3">Run</th>
                <th className="pr-3">Strat</th>
                <th className="pr-3">Flood</th>
                <th className="pr-3">Seed</th>
                <th className="pr-3">TET</th>
                <th className="pr-3">AET</th>
                <th className="pr-3">ECR</th>
                <th className="pr-3">EI</th>
                <th>Src</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {history.map((r) => (
                <tr key={r.run_id} className="border-t border-white/5">
                  <td className="py-1 pr-3 font-mono">{r.run_id}</td>
                  <td className="pr-3">{r.strategy}</td>
                  <td className="pr-3">{r.flood_level}</td>
                  <td className="pr-3">{r.seed}</td>
                  <td className="pr-3">{r.kpis.TET}</td>
                  <td className="pr-3">{r.kpis.AET}</td>
                  <td className="pr-3">{r.kpis.ECR}</td>
                  <td className="pr-3">{r.kpis.EI}</td>
                  <td className="text-white/40">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
