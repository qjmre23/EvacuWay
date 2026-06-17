import type { RainfallData } from "../types";

function rainColor(mm: number): string {
  if (mm >= 15) return "#dc2626"; // intense
  if (mm >= 7.5) return "#f97316"; // heavy
  if (mm >= 2.5) return "#eab308"; // moderate
  return "#3b82f6"; // light
}

interface Props {
  data: RainfallData;
}

export default function RainfallCard({ data }: Props) {
  const stations = [...data.stations].sort((a, b) => b.rainfall_mm_hr - a.rainfall_mm_hr).slice(0, 6);
  if (stations.length === 0) return null;
  const max = Math.max(1, ...stations.map((s) => s.rainfall_mm_hr));

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-300">
          Live rainfall · PAGASA
        </h3>
        <span className="text-[10px] text-white/40">
          as of {data.observed_at || (data.live ? "now" : "sample")}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {stations.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-white/70" title={s.name}>
                {s.name}
              </span>
              <span className="tabular-nums font-medium" style={{ color: rainColor(s.rainfall_mm_hr) }}>
                {s.rainfall_mm_hr.toFixed(1)} mm/h
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded bg-white/10">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.max(4, (100 * s.rainfall_mm_hr) / max)}%`,
                  background: rainColor(s.rainfall_mm_hr),
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t border-white/10 pt-1 text-[10px] text-white/40">
        {stations.length} active station{stations.length === 1 ? "" : "s"}
        {data.live ? " · live" : " · sample"} · enriches edge flood susceptibility
      </p>
    </div>
  );
}
