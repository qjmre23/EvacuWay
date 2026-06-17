import { useMemo, useState } from "react";
import KpiCards from "./components/KpiCards";
import Legend from "./components/Legend";
import LoadingOverlay from "./components/LoadingOverlay";
import MapView, { type LayerToggles } from "./components/MapView";
import ResultsPanel from "./components/ResultsPanel";
import ScenarioPanel from "./components/ScenarioPanel";
import { useNetwork } from "./hooks/useNetwork";
import { useSimulation } from "./hooks/useSimulation";
import type { FloodLevel, KPIs, Strategy } from "./types";

const CITY_LIST = [
  "Caloocan", "Las Piñas", "Malabon", "Manila", "Marikina", "Muntinlupa",
  "Navotas", "Parañaque", "Pasig", "Quezon City", "Taguig", "Valenzuela",
];

type Tab = "map" | "controls" | "results";

export default function App() {
  const { network, results, apiOnline, loading, error } = useNetwork();
  const sim = useSimulation();

  const [strategy, setStrategy] = useState<Strategy>("B");
  const [flood, setFlood] = useState<FloodLevel>("moderate");
  const [seed, setSeed] = useState(42);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [layers, setLayers] = useState<LayerToggles>({
    flood: true,
    centers: true,
    origins: false,
    routes: true,
  });
  const [tab, setTab] = useState<Tab>("map");

  const baseline: KPIs | null = useMemo(() => {
    const cells = results?.summary?.cells ?? [];
    const c = cells.find((x) => x.strategy === "A" && x.flood_level === flood);
    if (!c) return null;
    return { TET: c.TET, AET: c.AET, ECR: c.ECR, NUI: c.NUI, EI: c.EI, SCP: c.SCP };
  }, [results, flood]);

  function toggleCity(c: string) {
    setSelectedCities((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }
  function toggleLayer(k: keyof LayerToggles) {
    setLayers((l) => ({ ...l, [k]: !l[k] }));
  }
  function run() {
    sim.run({
      strategy,
      flood_level: flood,
      seed,
      city_subset: selectedCities.length ? selectedCities : null,
    });
    setTab("map");
  }

  const routes = sim.current?.routes ?? [];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2">
        <div>
          <h1 className="text-base font-bold tracking-tight md:text-lg">
            EvacuWay <span className="text-sky-400">·</span>{" "}
            <span className="font-normal text-white/70">
              Metro Manila Evacuation Routing Simulation
            </span>
          </h1>
          <p className="text-[11px] text-white/40">
            Comparative evaluation of 3 routing strategies under typhoon &amp; flood
            conditions · NCR (17 LGUs) · no login required
          </p>
        </div>
        <span
          className={`hidden rounded-full px-2 py-1 text-[11px] md:inline ${
            apiOnline ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {apiOnline ? "Live API" : "Bundled data"}
        </span>
      </header>

      {/* mobile tabs */}
      <nav className="flex border-b border-white/10 md:hidden">
        {(["map", "controls", "results"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm capitalize ${
              tab === t ? "border-b-2 border-sky-400 text-white" : "text-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* sidebar */}
        <aside
          className={`w-full overflow-y-auto border-r border-white/10 bg-black/20 p-4 scroll-thin md:w-[320px] ${
            tab === "controls" ? "block" : "hidden md:block"
          }`}
        >
          <ScenarioPanel
            strategy={strategy}
            flood={flood}
            seed={seed}
            cities={CITY_LIST}
            selectedCities={selectedCities}
            running={sim.running}
            apiOnline={apiOnline}
            onStrategy={setStrategy}
            onFlood={setFlood}
            onSeed={setSeed}
            onToggleCity={toggleCity}
            onRun={run}
          />
        </aside>

        {/* main */}
        <main className="flex min-h-0 flex-1 flex-col">
          <section
            className={`relative h-[45vh] min-h-[320px] md:h-[55%] ${
              tab === "map" ? "block" : "hidden md:block"
            }`}
          >
            {loading && <LoadingOverlay message="Loading Metro Manila network…" />}
            {sim.running && <LoadingOverlay message="Running simulation…" />}
            {network && (
              <>
                <MapView
                  network={network}
                  routes={layers.routes ? routes : []}
                  strategy={strategy}
                  layers={layers}
                />
                <Legend layers={layers} onToggle={toggleLayer} />
              </>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center text-rose-300">
                {error}
              </div>
            )}
          </section>

          <section
            className={`flex-1 overflow-y-auto p-4 scroll-thin ${
              tab === "results" || tab === "map" ? "block" : "hidden md:block"
            }`}
          >
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/80">
                  KPIs{" "}
                  {sim.current
                    ? `· ${sim.current.run_id} (${sim.current.source})`
                    : "· run a scenario"}
                </h2>
                {sim.current && (
                  <span className="text-[11px] text-white/40">
                    Δ vs Strategy A baseline ({flood})
                  </span>
                )}
              </div>
              <KpiCards kpis={sim.current?.kpis ?? null} baseline={baseline} />
            </div>
            <ResultsPanel results={results} history={sim.history} />
          </section>
        </main>
      </div>
    </div>
  );
}
