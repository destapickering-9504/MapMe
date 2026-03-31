import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { insertSavedTrip, setSavedTripFavorite } from "../api/savedTripsClient";
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

/** Saved trip title (date lives in `created_at` only — avoids duplicating it in the favorites sidebar). */
function historyTitleForPayload(data: OptimizeResponse): string {
  return (data.origin_label ?? data.origin_query ?? "").trim() || "Route";
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

  const [activeSavedTrip, setActiveSavedTrip] = useState<{ id: string; isFavorite: boolean } | null>(null);
  const [savedTripsListVersion, setSavedTripsListVersion] = useState(0);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  /** Increment to remount the route builder (fresh start / stops) when user chooses “Optimize New Route”. */
  const [builderResetKey, setBuilderResetKey] = useState(0);

  const onOptimized = useCallback(
    async (data: OptimizeResponse) => {
      if (!user || !configured) return;
      try {
        const id = await insertSavedTrip(data, historyTitleForPayload(data));
        setActiveSavedTrip({ id, isFavorite: false });
      } catch {
        /* non-fatal */
      }
    },
    [user, configured]
  );

  const { result, loading, error, run, clear, applySavedResult: applySavedResultBase } = useOptimizeRoute({
    onOptimized
  });

  const applySavedResult = useCallback(
    (data: OptimizeResponse, meta?: { savedTripId: string; isFavorite: boolean }) => {
      applySavedResultBase(data);
      setFavoriteError(null);
      setActiveSavedTrip(meta ? { id: meta.savedTripId, isFavorite: meta.isFavorite } : null);
    },
    [applySavedResultBase]
  );
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
    setActiveSavedTrip(null);
    setFavoriteError(null);
    void run(payload);
  };

  const handleToggleFavorite = useCallback(async () => {
    if (!result || !user || !configured) return;
    const nextFavorite = !(activeSavedTrip?.isFavorite ?? false);
    setFavoriteError(null);
    setFavoriteBusy(true);
    try {
      let id = activeSavedTrip?.id ?? null;
      if (!id) {
        if (!nextFavorite) {
          return;
        }
        id = await insertSavedTrip(result, historyTitleForPayload(result), { isFavorite: true });
        setActiveSavedTrip({ id, isFavorite: true });
        setSavedTripsListVersion((v) => v + 1);
        return;
      }
      await setSavedTripFavorite(id, nextFavorite);
      setActiveSavedTrip({ id, isFavorite: nextFavorite });
      setSavedTripsListVersion((v) => v + 1);
    } catch (e) {
      setFavoriteError(e instanceof Error ? e.message : "Could not update favorite");
    } finally {
      setFavoriteBusy(false);
    }
  }, [result, user, configured, activeSavedTrip]);

  const handleOptimizeNewRoute = useCallback(() => {
    clear();
    setActiveSavedTrip(null);
    setFavoriteError(null);
    setSelectedRouteIndex(0);
    setBuilderResetKey((k) => k + 1);
  }, [clear]);

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
              key={builderResetKey}
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
                <SavedTripsPanel
                  currentResult={result}
                  listRefreshToken={savedTripsListVersion}
                  onLoadTrip={(row) =>
                    applySavedResult(row.payload, { savedTripId: row.id, isFavorite: row.is_favorite })
                  }
                />
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
                  isFavorite={activeSavedTrip?.isFavorite ?? false}
                  favoriteDisabled={!user || !configured}
                  favoriteDisabledTitle={
                    !user ? "Sign in to favorite routes" : !configured ? "Add Supabase env vars to use favorites" : undefined
                  }
                  favoriteBusy={favoriteBusy}
                  favoriteError={favoriteError}
                  onToggleFavorite={handleToggleFavorite}
                  onOptimizeNewRoute={handleOptimizeNewRoute}
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
