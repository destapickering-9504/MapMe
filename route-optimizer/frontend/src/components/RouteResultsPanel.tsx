import type { OptimizeResponse, RouteOption } from "../domain/routeTypes";
import { routeOptionCount } from "../map/routeSelection";

interface Props {
  result: OptimizeResponse | null;
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
}

function formatRouteSummary(option: RouteOption): string {
  return option.ordered_stores.join(" → ");
}

export default function RouteResultsPanel({ result, selectedRouteIndex, onSelectRoute }: Props) {
  if (!result) return null;
  const nRoutes = routeOptionCount(result);
  const allOptions: RouteOption[] = [result.best_route, ...result.alternatives];
  return (
    <section className="results-card">
      <h3>Starting location</h3>
      <p className="origin-zip-line">
        <strong>You entered:</strong> {result.origin_query}
      </p>
      <p className="resolved-address">{result.origin_address}</p>

      {result.destination_lat != null &&
        result.destination_lng != null &&
        result.destination_address &&
        result.destination_query && (
          <>
            <h3 className="section-spaced">End location</h3>
            <p className="origin-zip-line">
              <strong>You entered:</strong> {result.destination_query}
            </p>
            <p className="resolved-address">{result.destination_address}</p>
          </>
        )}

      <h3 className="section-spaced">Your stores (resolved addresses)</h3>
      <p className="muted-small">
        Places we matched to your lines (input order). Recommended visit order is optimized below.
      </p>
      <ul className="stops-resolved-list">
        {result.stops_resolved.map((stop, idx) => (
          <li key={`${stop.query}-${idx}`}>
            <div className="stop-query">{stop.query}</div>
            <div className="stop-address">{stop.address}</div>
          </li>
        ))}
      </ul>

      <p className="permutations-note">
        We compared <strong>{result.permutations_considered}</strong> combinations of{" "}
        <strong>store locations</strong> (alternate map matches per stop) and visit orders for total driving time
        {result.destination_lat != null ? " from start through all stops to your end location" : ""}.
        {result.alternatives.length > 0 ? (
          <>
            {" "}
            Extra routes use different matched stores when search returns them—not only the same pins in a different
            order.
          </>
        ) : null}
      </p>

      <h3 className="section-spaced">Pick a route</h3>
      <p className="muted-small">
        The suggested option is the fastest driving time. Other rows may use a different matched store (e.g. another
        Target) when available. Pick a row to preview that path on the map — the badge shows which route you&apos;re
        viewing.
      </p>
      <ul className="route-picker-list" role="radiogroup" aria-label="Route options">
        {allOptions.map((option, idx) => (
          <li key={`route-pick-${idx}-${option.total_minutes}`}>
            <label
              className={`route-picker-row ${selectedRouteIndex === idx ? "route-picker-row-active" : ""}`}
            >
              <input
                type="radio"
                name="route-option"
                checked={selectedRouteIndex === idx}
                onChange={() => onSelectRoute(idx)}
                aria-label={idx === 0 ? "Route 1 suggested fastest" : `Route ${idx + 1} alternative`}
              />
              <span className="route-picker-body">
                <span className="route-picker-title">
                  Route {idx + 1}
                  {idx === 0 ? <span className="route-picker-suggested"> · suggested</span> : null}
                </span>
                <span className="route-picker-summary">{formatRouteSummary(option)}</span>
                <span className="route-picker-minutes">{option.total_minutes.toFixed(1)} min driving</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <h3 className="section-spaced">Visit order for selected route</h3>
      <ol className="ordered-route-list">
        {allOptions[selectedRouteIndex]?.ordered_stops.map((stop, idx) => (
          <li key={`sel-${stop.query}-${idx}-${selectedRouteIndex}`}>
            <div className="stop-query">{stop.query}</div>
            <div className="stop-address">{stop.address}</div>
          </li>
        ))}
      </ol>
      <p className="minutes-pill">
        Total minutes: {allOptions[selectedRouteIndex]?.total_minutes.toFixed(1) ?? "—"}
      </p>

      {nRoutes > 1 && (
        <>
          <h4>Quick compare</h4>
          <ul className="alternatives-list">
            {result.alternatives.map((option, idx) => (
              <li key={`${idx}-${option.total_minutes}`}>
                <div className="alt-order">Route {idx + 2}: {option.ordered_stores.join(" → ")}</div>
                <div className="alt-minutes">{option.total_minutes.toFixed(1)} min</div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="explanation-text">{result.explanation}</p>

      <h3 className="section-spaced">About drive times</h3>
      <p className="muted-small travel-time-note">{result.travel_time_note}</p>
    </section>
  );
}
