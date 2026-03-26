import { useState } from "react";
import { fetchNearbyStores } from "../api/nearbyClient";
import type { NearbyRequest, NearbyResponse } from "../domain/routeTypes";

export function useNearbyStores() {
  const [data, setData] = useState<NearbyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (payload: NearbyRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNearbyStores(payload);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setData(null);
    setError(null);
  };

  return { data, loading, error, run, clear };
}
