"""
Run the full EvacuWay experiment: 3 strategies x 3 flood levels x 30 seeds = 270 runs.

Stores one JSON per run plus aggregate summary + statistics to data/results/.
Also writes frontend/public/sample_results.json so the dashboard has bundled data
to display even when the API is offline.

Usage:
    python scripts/run_experiment.py
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend import config  # noqa: E402
from backend.analysis import aggregate, full_statistics, run_full_experiment  # noqa: E402


def main() -> None:
    t0 = time.time()
    print(f"Running {len(config.STRATEGIES) * len(config.FLOOD_LEVELS) * len(config.SEEDS)} "
          f"simulations (3 strategies x 3 flood levels x {len(config.SEEDS)} seeds)...")
    df = run_full_experiment(persist=True, progress=True)
    summary = aggregate(df)
    stats = full_statistics(df)

    (config.RESULTS_DIR / "statistics.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")

    bundle = {
        "summary": summary,
        "statistics": stats,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "n_runs": int(len(df)),
    }
    public = ROOT / "frontend" / "public"
    public.mkdir(parents=True, exist_ok=True)
    (public / "sample_results.json").write_text(json.dumps(bundle, indent=2), encoding="utf-8")

    print(f"\nDone in {time.time() - t0:.1f}s. {len(df)} runs stored to {config.RESULTS_DIR}")
    print("\n=== Aggregate KPIs (Table 4) ===")
    print(f"{'Strat':<6}{'Flood':<10}{'TET':>8}{'AET':>8}{'ECR':>8}{'NUI':>8}{'EI':>8}{'SCP':>8}")
    for c in summary["cells"]:
        print(f"{c['strategy']:<6}{c['flood_level']:<10}{c['TET']:>8}{c['AET']:>8}"
              f"{c['ECR']:>8}{c['NUI']:>8}{c['EI']:>8}{c['SCP']:>8}")


if __name__ == "__main__":
    main()
