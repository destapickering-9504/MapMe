import type { RouteTransportMode } from "./types";

export function historyRoutesSectionMeta(
  filterSavedOnly: boolean,
  routeTypeFilter: RouteTransportMode | null
): { id: string; title: string } {
  const mode = routeTypeFilter;
  const modeWord =
    mode === "driving" ? "Driving" : mode === "walking" ? "Walking" : mode === "transit" ? "Transit" : null;

  if (modeWord) {
    const title = filterSavedOnly ? `Saved ${modeWord} Routes` : `${modeWord} Routes`;
    const id = filterSavedOnly ? `saved-${mode}-routes-heading` : `${mode}-routes-heading`;
    return { id, title };
  }

  return {
    id: filterSavedOnly ? "saved-routes-heading" : "all-routes-heading",
    title: filterSavedOnly ? "Saved routes" : "All routes"
  };
}
