import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { insertSavedTrip } from "../api/savedTripsClient";
import SavedTripsPanel from "../components/SavedTripsPanel";
import "../components/route-planner/plannerRef.css";
import RouteBuilderPanel, { type SaveLocationToProfileResult } from "../components/route-planner/RouteBuilderPanel";
import MapCanvas from "../components/route-planner/MapCanvas";
import RouteSummaryCard from "../components/route-planner/RouteSummaryCard";
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
import "./history/historyRef.css";
import "./planner/planner.tailwind.css";

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

  const mainColumn = (
    <div className="hm-ref-planner-workspace relative min-h-0 w-full min-w-0 flex-1">
        {/* Route builder — desktop: floating card over map */}
        <div className="hm-ref-planner-builder-wrap">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5 lg:pr-1">
            <RouteBuilderPanel
              onSubmit={handleOptimize}
              savedPlaces={savedPlaces}
              onSaveLocationToProfile={user && configured && supabase ? saveLocationToProfile : undefined}
              optimizeLoading={loading}
            />
            {error ? (
              <p
                className="mt-3 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[13px] font-semibold text-red-200"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <details className="group hm-ref-planner-saved-details">
              <summary className="hm-ref-planner-saved-summary marker:content-none">
                <span className="hm-ref-planner-saved-summary-text">
                  Saved trips
                  <span className="hm-ref-planner-saved-chevron" aria-hidden>
                    ▾
                  </span>
                </span>
              </summary>
              <div className="mt-3">
                <SavedTripsPanel currentResult={result} onLoadTrip={applySavedResult} />
              </div>
            </details>
          </div>
        </div>

        {/* Map + summary */}
        <div className="hm-ref-planner-map-column">
          <div className="relative flex min-h-[min(360px,45dvh)] flex-1 lg:min-h-0">
            <MapCanvas result={result} selectedRouteIndex={selectedRouteIndex} />
            {result ? (
              <div className="pointer-events-none absolute right-3 top-3 z-[1100] max-w-[calc(100%-1.5rem)] sm:right-5 sm:top-5">
                <RouteSummaryCard
                  result={result}
                  selectedRouteIndex={selectedRouteIndex}
                  onSelectRoute={setSelectedRouteIndex}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
  );

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{mainColumn}</div>
  );
}
