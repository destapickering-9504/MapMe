import { useState } from "react";
import { optimizeRoute } from "../api/optimizeClient";
import type { OptimizeRequest, OptimizeResponse } from "../domain/routeTypes";

export interface UseOptimizeRouteOptions {
  /** Called only after a successful API optimize (not when restoring from saved data). */
  onOptimized?: (data: OptimizeResponse) => void | Promise<void>;
}

export function useOptimizeRoute(options?: UseOptimizeRouteOptions) {
  const onOptimized = options?.onOptimized;
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (payload: OptimizeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await optimizeRoute(payload);
      setResult(data);
      onOptimized?.(data);
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

  const applySavedResult = (data: OptimizeResponse) => {
    setError(null);
    setResult(data);
  };

  return { result, loading, error, run, clear, applySavedResult };
}
