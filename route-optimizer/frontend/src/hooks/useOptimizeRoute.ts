import { useState } from "react";
import { optimizeRoute } from "../api/optimizeClient";
import type { OptimizeRequest, OptimizeResponse } from "../domain/routeTypes";

export function useOptimizeRoute() {
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (payload: OptimizeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await optimizeRoute(payload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
  };

  return { result, loading, error, run, clear };
}
