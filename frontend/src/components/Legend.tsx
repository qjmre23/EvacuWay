import type { LayerToggles } from "./MapView";

interface Props {
  layers: LayerToggles;
  onToggle: (k: keyof LayerToggles) => void;
}

const ITEMS: { key: keyof LayerToggles; label: string; swatch: string }[] = [
  { key: "flood", label: "Flood risk points", swatch: "#dc2626" },
  { key: "centers", label: "Evacuation centers", swatch: "#22c55e" },
  { key: "origins", label: "Origin zones", swatch: "#fb923c" },
  { key: "routes", label: "Evacuation routes", swatch: "#38bdf8" },
];

export default function Legend({ layers, onToggle }: Props) {
  return (
    <div className="absolute bottom-3 right-3 z-[1000] rounded-lg border border-white/10 bg-black/70 p-3 text-xs backdrop-blur">
      <div className="mb-1 font-semibold text-white/80">Map layers</div>
      {ITEMS.map((it) => (
        <label key={it.key} className="flex cursor-pointer items-center gap-2 py-0.5">
          <input
            type="checkbox"
            checked={layers[it.key]}
            onChange={() => onToggle(it.key)}
          />
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: it.swatch }}
          />
          {it.label}
        </label>
      ))}
      <div className="mt-2 border-t border-white/10 pt-1 text-white/50">
        Routes: <span style={{ color: "#2563eb" }}>A</span> ·{" "}
        <span style={{ color: "#f59e0b" }}>B</span> ·{" "}
        <span style={{ color: "#dc2626" }}>C</span>
      </div>
    </div>
  );
}
