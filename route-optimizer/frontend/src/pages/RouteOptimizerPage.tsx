import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { insertSavedTrip } from "../api/savedTripsClient";
import RouteMap from "../components/RouteMap";
import RouteResultsPanel from "../components/RouteResultsPanel";
import SavedTripsPanel from "../components/SavedTripsPanel";
import StoreInputForm, { type SaveLocationToProfileResult } from "../components/StoreInputForm";
import type { OptimizeRequest, OptimizeResponse } from "../domain/routeTypes";
import {
  createProfileSavedPlaceId,
  parseProfileSavedPlaces,
  profileSavedPlacesUserDataUpdate
} from "../domain/profileSavedPlaces";
import { computeStartLocationQuery } from "../domain/savedStartLocations";
import { useOptimizeRoute } from "../hooks/useOptimizeRoute";
import { supabase } from "../lib/supabaseClient";
import { ROUTE_OPTIMIZER_PATH } from "../routes/paths";

function historyTitleForPayload(data: OptimizeResponse): string {
  const when = new Date().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  return `${data.origin_query} · ${when}`;
}

export const RESTORE_TRIP_STATE_KEY = "restoreTrip";

export default function RouteOptimizerPage() {
  const { user, configured } = useAuth();

  const savedPlaces = useMemo(
    () => (user ? parseProfileSavedPlaces(user.user_metadata as Record<string, unknown>) : []),
    [user]
  );
  const navigate = useNavigate();
  const location = useLocation();
  const restoreConsumed = useRef(false);

  const onOptimized = useCallback(
    (data: OptimizeResponse) => {
      if (!user || !configured) return;
      void insertSavedTrip(data, historyTitleForPayload(data)).catch(() => {
        /* non-fatal */
      });
    },
    [user, configured]
  );

  const { result, loading, error, run, applySavedResult } = useOptimizeRoute({ onOptimized });
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  useEffect(() => {
    setSelectedRouteIndex(0);
  }, [result]);

  useEffect(() => {
    const state = location.state as { [RESTORE_TRIP_STATE_KEY]?: OptimizeResponse } | null;
    const payload = state?.[RESTORE_TRIP_STATE_KEY];
    if (!payload) {
      restoreConsumed.current = false;
      return;
    }
    if (restoreConsumed.current) return;
    restoreConsumed.current = true;
    applySavedResult(payload);
    navigate(ROUTE_OPTIMIZER_PATH, { replace: true, state: {} });
  }, [location.state, applySavedResult, navigate]);

  const handleOptimize = (payload: OptimizeRequest) => {
    void run(payload);
  };

  const saveLocationToProfile = useCallback(
    async (name: string, address: string): Promise<SaveLocationToProfileResult> => {
      if (!supabase || !user) {
        return { ok: false, message: "Sign in to save locations." };
      }
      const n = name.trim();
      const a = address.trim();
      if (!n || !a) {
        return { ok: false, message: "Add a name and address first." };
      }
      const meta = user.user_metadata as Record<string, unknown>;
      const current = parseProfileSavedPlaces(meta);
      if (current.some((x) => x.label.toLowerCase() === n.toLowerCase() && x.address.toLowerCase() === a.toLowerCase())) {
        return { ok: false, message: "This place is already in your saved places." };
      }
      const next = [
        ...current,
        { id: createProfileSavedPlaceId(), label: n, address: a, query: computeStartLocationQuery(n, a) }
      ];
      const { error: err } = await supabase.auth.updateUser({
        data: profileSavedPlacesUserDataUpdate(next)
      });
      if (err) return { ok: false, message: err.message };
      return { ok: true };
    },
    [user]
  );

  return (
    <main className="app-shell">
      <aside className="left-panel">
        <section className="brand-card">
          <h1>Route Optimizer</h1>
        </section>

        <div className="tab-panel">
          <StoreInputForm
            onSubmit={handleOptimize}
            savedPlaces={savedPlaces}
            onSaveLocationToProfile={user && configured && supabase ? saveLocationToProfile : undefined}
          />
          {loading && <p className="status-text">Optimizing...</p>}
          {error && (
            <p className="status-text error-text" role="alert">
              {error}
            </p>
          )}
          <RouteResultsPanel
            result={result}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={setSelectedRouteIndex}
          />
          <SavedTripsPanel currentResult={result} onLoadTrip={applySavedResult} />
        </div>
      </aside>

      <RouteMap result={result} selectedRouteIndex={selectedRouteIndex} />
    </main>
  );
}
