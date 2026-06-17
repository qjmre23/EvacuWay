import { useEffect, useState } from "react";
import { checkHealth, fetchNetwork, fetchResults } from "../api/client";
import type { NetworkData, ResultsBundle } from "../types";

export function useNetwork() {
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [results, setResults] = useState<ResultsBundle | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [net, res, online] = await Promise.all([
          fetchNetwork(),
          fetchResults(),
          checkHealth(),
        ]);
        if (!alive) return;
        setNetwork(net);
        setResults(res);
        setApiOnline(online);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { network, results, apiOnline, loading, error };
}
