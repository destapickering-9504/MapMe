import { useMemo } from "react";

import "./plannerRef.css";
import type { OptimizeResponse } from "../../domain/routeTypes";
import {
  buildExternalNavigationLinks,
  type ExternalNavigationLinks
} from "../../lib/externalDirections/externalNavigationLinks";
import { orderedLatLngPointsForExternalDirections } from "../../lib/externalDirections/googleMapsDirectionsUrl";
import { externalDirectionsTravelModeKeyFromResult } from "../../lib/externalDirections/travelModes";
import { chainHaversineMiles } from "../../lib/haversineRouteMiles";
import { plannerStopCommonLabel } from "../../lib/plannerStopLabel";
import { routeOptionByIndex, routeOptionCount } from "../../map/routeSelection";

interface Props {
  result: OptimizeResponse;
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  isFavorite: boolean;
  favoriteDisabled: boolean;
  /** Shown as tooltip when the star is disabled (e.g. guest vs missing backend). */
  favoriteDisabledTitle?: string;
  favoriteBusy: boolean;
  favoriteError: string | null;
  onToggleFavorite: () => void;
  onOptimizeNewRoute: () => void;
}

function RouteExternalNavLinks({ links, routeLabel }: { links: ExternalNavigationLinks; routeLabel: string }) {
  const truncated = links.google.truncated || links.apple.truncated;
  const truncHint =
    "Too many stops for this app link; showing start to final destination only. Add middle stops in the app if needed.";
  return (
    <div className="hm-ref-planner-route-maps-group" role="group" aria-label={`Open ${routeLabel} in maps`}>
      <a
        href={links.google.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hm-ref-planner-route-maps-link"
        title={truncated ? `Google Maps — ${truncHint}` : `Google Maps — ${routeLabel}`}
      >
        Google
      </a>
      <a
        href={links.apple.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hm-ref-planner-route-maps-link"
        title={truncated ? `Apple Maps — ${truncHint}` : `Apple Maps — ${routeLabel}`}
      >
        Apple
      </a>
      <a
        href={links.waze.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hm-ref-planner-route-maps-link"
        title={
          links.waze.opensFinalStopOnly
            ? `Waze — opens navigation to your final stop; add earlier stops in Waze if needed.`
            : `Waze — ${routeLabel}`
        }
      >
        Waze
      </a>
    </div>
  );
}

function milesAlongSelectedRoute(result: OptimizeResponse, index: number): number {
  const opt = routeOptionByIndex(result, index);
  const pts: { lat: number; lng: number }[] = [{ lat: result.origin_lat, lng: result.origin_lng }];
  for (const s of opt.ordered_stops) {
    pts.push({ lat: s.lat, lng: s.lng });
  }
  if (
    result.destination_lat != null &&
    result.destination_lng != null &&
    !Number.isNaN(result.destination_lat) &&
    !Number.isNaN(result.destination_lng)
  ) {
    pts.push({ lat: result.destination_lat, lng: result.destination_lng });
  } else if (result.trip_mode === "round_trip") {
    pts.push({ lat: result.origin_lat, lng: result.origin_lng });
  }
  return chainHaversineMiles(pts);
}

export default function RouteSummaryCard({
  result,
  selectedRouteIndex,
  onSelectRoute,
  isFavorite,
  favoriteDisabled,
  favoriteDisabledTitle,
  favoriteBusy,
  favoriteError,
  onToggleFavorite,
  onOptimizeNewRoute
}: Props) {
  const n = routeOptionCount(result);
  const allOptions = [result.best_route, ...result.alternatives];
  const selected = routeOptionByIndex(result, selectedRouteIndex);
  const minutes = selected.total_minutes;
  const miles = milesAlongSelectedRoute(result, selectedRouteIndex);

  const worst = Math.max(...allOptions.map((o) => o.total_minutes));
  const best = result.best_route.total_minutes;
  const saved = n > 1 && worst > best ? Math.round(worst - best) : 0;
  const pct = n > 1 && worst > 0 ? Math.round((saved / worst) * 100) : 0;

  const isRound = result.trip_mode === "round_trip";
  const lastStop = selected.ordered_stops[selected.ordered_stops.length - 1];
  const hasFixedDestination =
    result.destination_query?.trim() &&
    result.destination_lat != null &&
    result.destination_lng != null &&
    !Number.isNaN(result.destination_lat) &&
    !Number.isNaN(result.destination_lng);

  const endsAtLabel = (() => {
    if (hasFixedDestination) {
      const dq = result.destination_query!.trim();
      return plannerStopCommonLabel({
        query: dq,
        address: result.destination_address ?? dq,
        lat: result.destination_lat!,
        lng: result.destination_lng!
      });
    }
    return lastStop ? plannerStopCommonLabel(lastStop) : "—";
  })();

  const originSummaryLabel =
    result.origin_label?.trim() ||
    plannerStopCommonLabel({
      query: result.origin_query,
      address: result.origin_address,
      lat: result.origin_lat,
      lng: result.origin_lng
    });

  const navigationLinksByRouteIndex = useMemo((): (ExternalNavigationLinks | null)[] => {
    const travelKey = externalDirectionsTravelModeKeyFromResult(result.transport_mode);
    const count = routeOptionCount(result);
    const out: (ExternalNavigationLinks | null)[] = [];
    for (let i = 0; i < count; i++) {
      const pts = orderedLatLngPointsForExternalDirections(result, i);
      out.push(buildExternalNavigationLinks(pts, travelKey));
    }
    return out;
  }, [result]);

  return (
    <aside
      className="hm-ref-planner-summary pointer-events-auto w-full min-w-0 max-w-[300px]"
      aria-label="Route summary"
    >
      <div className="hm-ref-planner-summary-header mb-3 flex items-start gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="hm-ref-planner-summary-check shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2>{saved > 0 ? `Saved you ${saved} minutes` : "Your optimized route"}</h2>
            {saved > 0 && pct > 0 ? (
              <p className="hm-ref-planner-summary-sage mt-0.5 text-[13px] font-medium">{pct}% shorter</p>
            ) : (
              <p className="hm-ref-planner-muted-small mt-0.5 text-[13px] font-medium">Fastest order for your stops</p>
            )}
          </div>
        </div>
        <button
          type="button"
          className={[
            "hm-ref-planner-summary-favorite-btn",
            isFavorite ? "hm-ref-planner-summary-favorite-btn--active" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remove route from favorites" : "Add route to favorites"}
          disabled={favoriteDisabled || favoriteBusy}
          title={
            favoriteDisabled
              ? (favoriteDisabledTitle ?? "Unavailable")
              : isFavorite
                ? "Remove from favorites"
                : "Save to favorites"
          }
          onClick={onToggleFavorite}
        >
          {favoriteBusy ? (
            <span className="hm-ref-planner-summary-favorite-spinner" aria-hidden />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              {isFavorite ? (
                <path
                  fill="currentColor"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              ) : (
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              )}
            </svg>
          )}
        </button>
      </div>
      {favoriteError ? (
        <p className="hm-ref-planner-summary-favorite-error mb-3 text-[12px] font-medium" role="alert">
          {favoriteError}
        </p>
      ) : null}

      <div className="mb-4 flex gap-3">
        <div className="hm-ref-planner-summary-stat">
          <span className="hm-ref-planner-summary-icon shrink-0" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <div className="hm-ref-planner-summary-stat-val">{Math.round(minutes)}</div>
            <div className="hm-ref-planner-summary-stat-unit">min</div>
          </div>
        </div>
        <div className="hm-ref-planner-summary-stat">
          <span className="hm-ref-planner-summary-icon shrink-0" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 16H9m10 0h3v-3.5a1 1 0 00-.8-.99l-2.47-.49-2.46-4.9a2 2 0 00-1.79-1.1H9.5a2 2 0 00-1.8 1.1l-2.46 4.9-2.47.49A1 1 0 003 12.5V16h3" />
              <circle cx="7.5" cy="16.5" r="1.5" />
              <circle cx="16.5" cy="16.5" r="1.5" />
            </svg>
          </span>
          <div>
            <div className="hm-ref-planner-summary-stat-val">{miles.toFixed(1)}</div>
            <div className="hm-ref-planner-summary-stat-unit">miles</div>
          </div>
        </div>
      </div>

      {n === 1 && navigationLinksByRouteIndex[0] ? (
        <div className="hm-ref-planner-route-row mb-3">
          <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-[color:var(--ref-title,#f8fafc)]">
            Route 1
            <span className="hm-ref-planner-summary-sage ml-1 font-semibold">· best</span>
          </span>
          <RouteExternalNavLinks links={navigationLinksByRouteIndex[0]!} routeLabel="Route 1" />
        </div>
      ) : null}

      <ol className="mb-4 list-none space-y-2.5 border-t border-[color:var(--ref-line,rgba(255,255,255,0.09))] p-0 pt-4">
        {!isRound ? (
          <li key="summary-start" className="flex items-start gap-3 text-[14px]">
            <span className="hm-ref-planner-summary-stop-num hm-ref-planner-summary-stop-num--start mt-0.5 shrink-0">
              ⌂
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-[color:var(--ref-meta,#7b8394)]">
                Start
              </span>
              <span className="hm-ref-planner-summary-stop-name">{originSummaryLabel || "—"}</span>
            </span>
          </li>
        ) : null}
        {selected.ordered_stops.map((stop, idx) => (
          <li key={`${stop.query}-${idx}`} className="flex items-start gap-3 text-[14px]">
            <span className="hm-ref-planner-summary-stop-num mt-0.5 shrink-0">{idx + 1}</span>
            <span className="hm-ref-planner-summary-stop-name min-w-0 flex-1">{plannerStopCommonLabel(stop)}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-3 border-t border-[color:var(--ref-line,rgba(255,255,255,0.09))] pt-4">
        {isRound ? (
          <div className="hm-ref-planner-round-trip-block space-y-2.5">
            <p className="hm-ref-planner-round-trip-title m-0 text-[14px] font-bold tracking-tight text-[color:var(--ref-title,#f8fafc)]">
              Round Trip
            </p>
            <div className="hm-ref-planner-round-trip-rule" role="presentation" />
            <p className="hm-ref-planner-summary-wrap m-0 text-[13px] text-[color:var(--ref-path,#aeb4bf)]">
              <span className="text-[color:var(--ref-meta,#7b8394)]">Returns to: </span>
              <span className="hm-ref-planner-summary-sage font-semibold">{originSummaryLabel || "Home"}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="hm-ref-planner-summary-wrap m-0 text-[13px] font-medium leading-snug text-[color:var(--ref-path,#aeb4bf)]">
              <span className="text-[color:var(--ref-meta,#7b8394)]">One-way Route: </span>
              {hasFixedDestination ? "you finish at the end address you set." : "you finish at your last stop."}
            </p>
            <p className="hm-ref-planner-summary-wrap m-0 text-[13px] text-[color:var(--ref-path,#aeb4bf)]">
              <span className="text-[color:var(--ref-meta,#7b8394)]">Ends at: </span>
              <span className="hm-ref-planner-summary-sage font-semibold">{endsAtLabel}</span>
            </p>
          </div>
        )}
      </div>

      {n > 1 ? (
        <div className="mt-4 border-t border-[color:var(--ref-line,rgba(255,255,255,0.09))] pt-4">
          <p className="hm-ref-planner-other-label">Other routes</p>
          <ul className="flex flex-col gap-2 p-0" role="radiogroup" aria-label="Route options">
            {allOptions.map((opt, idx) => {
              const nav = navigationLinksByRouteIndex[idx];
              return (
                <li key={`route-${idx}-${opt.total_minutes}`} className="hm-ref-planner-route-row list-none">
                  <label
                    className={[
                      "hm-ref-planner-route-pill",
                      selectedRouteIndex === idx ? "hm-ref-planner-route-pill--active" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="radio"
                      name="route-option-summary"
                      checked={selectedRouteIndex === idx}
                      onChange={() => onSelectRoute(idx)}
                      aria-label={idx === 0 ? "Route 1 suggested fastest" : `Route ${idx + 1} alternative`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold text-[color:var(--ref-title,#f8fafc)]">
                        Route {idx + 1}
                        {idx === 0 ? (
                          <span className="hm-ref-planner-summary-sage ml-1 font-semibold">· best</span>
                        ) : null}
                      </span>
                      <span className="block text-[11px] leading-snug text-[color:var(--ref-meta,#7b8394)]">
                        {opt.ordered_stores.join(" → ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-[color:var(--ref-meta,#7b8394)]">
                      {Math.round(opt.total_minutes)}m
                    </span>
                  </label>
                  {nav ? <RouteExternalNavLinks links={nav} routeLabel={`Route ${idx + 1}`} /> : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 border-t border-[color:var(--ref-line,rgba(255,255,255,0.09))] pt-4">
        <button
          type="button"
          className="hm-ref-planner-cta hm-ref-planner-cta--ref-orange w-full"
          onClick={onOptimizeNewRoute}
        >
          Optimize New Route
        </button>
      </div>
    </aside>
  );
}
