import type { RouteTransportMode } from "./types";
import { routeModeChipIcon } from "./RouteModeChipIcons";

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterSavedOnly: boolean;
  onToggleSavedOnly: () => void;
  routeTypeFilter: RouteTransportMode | null;
  onRouteTypeChange: (mode: RouteTransportMode | null) => void;
  sortNewestFirst: boolean;
  onSortNewestFirst: (value: boolean) => void;
}

const ROUTE_TYPES: { mode: RouteTransportMode; label: string }[] = [
  { mode: "driving", label: "Driving" },
  { mode: "walking", label: "Walking" },
  { mode: "transit", label: "Transit" }
];

export function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  filterSavedOnly,
  onToggleSavedOnly,
  routeTypeFilter,
  onRouteTypeChange,
  sortNewestFirst,
  onSortNewestFirst
}: Props) {
  return (
    <div style={{ marginBottom: "2.25rem" }}>
      <label className="hm-ref-search-wrap">
        <span className="sr-only">Search routes, places, or stops</span>
        <span className="hm-ref-search-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          className="hm-ref-search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search routes, places, or stops..."
          autoComplete="off"
        />
      </label>

      <div className="hm-ref-filters-row">
        <div className="hm-ref-chips">
          <button
            type="button"
            onClick={onToggleSavedOnly}
            aria-pressed={filterSavedOnly}
            className={`hm-ref-chip ${filterSavedOnly ? "hm-ref-chip--active-sage" : ""}`}
          >
            {filterSavedOnly ? <span className="hm-ref-check">✓</span> : null}
            <span style={{ color: filterSavedOnly ? "var(--ref-gold)" : undefined }}>★</span>
            Saved
          </button>

          {ROUTE_TYPES.map(({ mode, label }) => {
            const active = routeTypeFilter === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onRouteTypeChange(active ? null : mode)}
                aria-pressed={active}
                className={`hm-ref-chip ${active ? "hm-ref-chip--active-ring" : ""}`}
                style={active ? { color: "var(--ref-title)" } : undefined}
              >
                <span style={{ color: active ? "var(--ref-sage)" : "var(--ref-meta)" }}>
                  {routeModeChipIcon(mode)}
                </span>
                {label}
              </button>
            );
          })}
        </div>

        <div className="hm-ref-sort-bar" role="group" aria-label="Sort by date">
          <button
            type="button"
            onClick={() => onSortNewestFirst(true)}
            aria-pressed={sortNewestFirst}
            className={`hm-ref-sort-btn ${sortNewestFirst ? "hm-ref-sort-btn--on" : ""}`}
          >
            Recent ↓
          </button>
          <button
            type="button"
            onClick={() => onSortNewestFirst(false)}
            aria-pressed={!sortNewestFirst}
            className={`hm-ref-sort-btn ${!sortNewestFirst ? "hm-ref-sort-btn--on" : ""}`}
          >
            Oldest ↑
          </button>
        </div>
      </div>
    </div>
  );
}
