import "./plannerRef.css";
import type { OptimizeResponse } from "../../domain/routeTypes";
import { chainHaversineMiles } from "../../lib/haversineRouteMiles";
import { routeOptionByIndex, routeOptionCount } from "../../map/routeSelection";

interface Props {
  result: OptimizeResponse;
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
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

function LoopToggle({ on }: { on: boolean }) {
  return (
    <span
      className={["hm-ref-planner-loop-toggle", on ? "hm-ref-planner-loop-toggle--on" : "hm-ref-planner-loop-toggle--off"].join(
        " "
      )}
      aria-hidden
    >
      <span className="hm-ref-planner-loop-toggle-knob" />
    </span>
  );
}

export default function RouteSummaryCard({ result, selectedRouteIndex, onSelectRoute }: Props) {
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
  const endLabel = lastStop?.query ?? "last stop";

  return (
    <aside className="hm-ref-planner-summary pointer-events-auto w-full max-w-[300px]" aria-label="Route summary">
      <div className="mb-4 flex items-start gap-3">
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

      <ol className="mb-4 list-none space-y-2.5 border-t border-[color:var(--ref-line,rgba(255,255,255,0.09))] p-0 pt-4">
        {selected.ordered_stops.map((stop, idx) => (
          <li key={`${stop.query}-${idx}`} className="flex items-center gap-3 text-[14px]">
            <span className="hm-ref-planner-summary-stop-num">{idx + 1}</span>
            <span className="hm-ref-planner-summary-stop-name">{stop.query}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-3 border-t border-[color:var(--ref-line,rgba(255,255,255,0.09))] pt-4">
        {isRound ? (
          <p className="flex items-center gap-2 text-[13px] text-[color:var(--ref-path,#aeb4bf)]">
            <span className="hm-ref-planner-summary-clock" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="text-[color:var(--ref-meta,#7b8394)]">Returns to: </span>
              <span className="hm-ref-planner-summary-sage font-semibold">{result.origin_query || "Home"}</span>
            </span>
          </p>
        ) : (
          <p className="text-[13px] text-[color:var(--ref-path,#aeb4bf)]">
            <span className="text-[color:var(--ref-meta,#7b8394)]">Ends at: </span>
            <span className="hm-ref-planner-summary-sage font-semibold">{endLabel}</span>
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-[color:var(--ref-meta,#7b8394)]">
            {isRound ? "Loop route" : "One-way route"}
          </span>
          <LoopToggle on={isRound} />
        </div>
      </div>

      {n > 1 ? (
        <div className="mt-4 border-t border-[color:var(--ref-line,rgba(255,255,255,0.09))] pt-4">
          <p className="hm-ref-planner-other-label">Other routes</p>
          <ul className="flex flex-col gap-1.5 p-0" role="radiogroup" aria-label="Route options">
            {allOptions.map((opt, idx) => (
              <li key={`route-${idx}-${opt.total_minutes}`} className="list-none">
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
                    <span className="block truncate text-[11px] text-[color:var(--ref-meta,#7b8394)]">
                      {opt.ordered_stores.join(" → ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold tabular-nums text-[color:var(--ref-meta,#7b8394)]">
                    {Math.round(opt.total_minutes)}m
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
