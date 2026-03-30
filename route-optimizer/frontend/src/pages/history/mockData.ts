import type { ListSavedTripsPageParams, ListSavedTripsPageResult } from "../../api/savedTripsClient";
import type { OptimizeResponse } from "../../domain/routeTypes";
import { routeTypeFromRow, rowToViewModel } from "./historyMappers";
import type { HistoryRouteViewModel, RouteTransportMode } from "./types";
import type { SavedTripRow } from "../../api/savedTripsClient";

function rowMatchesSearch(row: SavedTripRow, q: string): boolean {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return true;
  const title = (row.title ?? "").toLowerCase();
  const origin = (row.payload?.origin_query ?? "").toLowerCase();
  if (title.includes(trimmed) || origin.includes(trimmed)) return true;
  for (const s of row.payload?.stops_resolved ?? []) {
    if ((s.query ?? "").toLowerCase().includes(trimmed)) return true;
    if ((s.address ?? "").toLowerCase().includes(trimmed)) return true;
  }
  return false;
}

function buildPayload(params: {
  origin: string;
  stops: string[];
  minutes: number;
  createdLabel?: string;
  transport_mode?: RouteTransportMode;
  transit_thumb?: "bus" | "train";
}): OptimizeResponse {
  const { origin, stops, minutes, transport_mode, transit_thumb } = params;
  const ordered_stops = stops.map((query, i) => ({
    query,
    address: query,
    lat: 47.67 + i * 0.02,
    lng: -122.38 + i * 0.02
  }));
  return {
    trip_mode: "round_trip",
    origin_query: origin,
    origin_address: origin,
    origin_lat: 47.67,
    origin_lng: -122.39,
    stops_resolved: ordered_stops,
    permutations_considered: 1,
    best_route: {
      ordered_stores: stops,
      ordered_stops,
      total_minutes: minutes
    },
    alternatives: [],
    explanation: "",
    travel_time_note: "",
    best_route_geojson: null,
    ...(transport_mode ? { transport_mode } : {}),
    ...(transit_thumb ? { transit_thumb } : {})
  };
}

function mockRow(
  id: string,
  title: string,
  payload: OptimizeResponse,
  isFavorite: boolean,
  created_at: string
): SavedTripRow {
  return {
    id,
    user_id: "mock",
    title,
    payload,
    created_at,
    is_favorite: isFavorite
  };
}

/**
 * Example routes for design reference and local UI experiments.
 * `RouteHistoryPage` uses live Supabase data; import this where you want static demos.
 */
export const MOCK_HISTORY_ROWS: SavedTripRow[] = [
  mockRow(
    "mock-1",
    "Sunday errands",
    buildPayload({
      origin: "The Commons at Ballard",
      stops: ["Petco", "Whole Foods"],
      minutes: 54
    }),
    true,
    new Date(Date.now() - 86400000).toISOString()
  ),
  mockRow(
    "mock-2",
    "Gym & Groceries Loop",
    buildPayload({
      origin: "Home",
      stops: ["QFC", "LA Fitness"],
      minutes: 72,
      transport_mode: "transit",
      transit_thumb: "bus"
    }),
    true,
    new Date(Date.now() - 5 * 86400000).toISOString()
  ),
  mockRow(
    "mock-3",
    "After work stops",
    buildPayload({
      origin: "Work",
      stops: ["Trader Joe's", "Pharmacy"],
      minutes: 65,
      transport_mode: "transit",
      transit_thumb: "train"
    }),
    false,
    new Date(Date.now() - 8 * 86400000).toISOString()
  ),
  mockRow(
    "mock-4",
    "Coffee run",
    buildPayload({
      origin: "Ballard",
      stops: ["Starbucks"],
      minutes: 18,
      transport_mode: "walking"
    }),
    false,
    new Date(Date.now() - 12 * 86400000).toISOString()
  )
];

/** View models derived from {@link MOCK_HISTORY_ROWS} (same shape as mapped API rows). */
export const MOCK_HISTORY_ROUTES: HistoryRouteViewModel[] = MOCK_HISTORY_ROWS.map(rowToViewModel);

/** In-memory pagination/filter for `USE_HISTORY_MOCK` on Route History. */
export function mockListSavedTripsPage(params: ListSavedTripsPageParams): ListSavedTripsPageResult {
  let list = [...MOCK_HISTORY_ROWS];
  if (params.savedOnly) list = list.filter((r) => r.is_favorite);
  if (params.transportMode) {
    list = list.filter((r) => routeTypeFromRow(r) === params.transportMode);
  }
  const search = params.search?.trim();
  if (search) list = list.filter((r) => rowMatchesSearch(r, search));
  list.sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
    return params.newestFirst !== false ? tb - ta : ta - tb;
  });
  const limit = params.limit ?? 20;
  const offset = Math.max(0, params.offset ?? 0);
  return {
    totalCount: list.length,
    rows: list.slice(offset, offset + limit)
  };
}
