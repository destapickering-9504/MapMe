export interface OptimizeRequest {
  origin_place: string;
  /**
   * Optional: saved start label (Home, Gym, …). Geocoding uses `origin_place` (address) only;
   * the API echoes this for UI.
   */
  origin_label?: string | null;
  stores: string[];
  trip_mode: "round_trip" | "one_way";
  /** Optional API field: fixed end after stops (not used by the current planner UI). */
  destination_place?: string;
}

export interface StopDetail {
  query: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RouteOption {
  ordered_stores: string[];
  ordered_stops: StopDetail[];
  total_minutes: number;
}

export interface GeoJsonLineString {
  type: "LineString";
  coordinates: number[][];
}

export interface OptimizeResponse {
  trip_mode: "round_trip" | "one_way";
  origin_query: string;
  /** Present when the user chose a saved start; prefer this for display over shortening `origin_query`. */
  origin_label?: string | null;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  stops_resolved: StopDetail[];
  permutations_considered: number;
  best_route: RouteOption;
  alternatives: RouteOption[];
  explanation: string;
  /** Free-flow vs traffic; optional server congestion bbox. */
  travel_time_note: string;
  best_route_geojson: GeoJsonLineString | null;
  /** Polyline for each ranked option: [best, ...alternatives]. */
  route_geojson_options?: (GeoJsonLineString | null)[] | null;
  destination_query?: string | null;
  destination_address?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  /** Persisted on saved trips for history UI (driving until set by client or API). */
  transport_mode?: "driving" | "walking" | "transit";
  /** When using transit, optional hint for bus vs train thumbnail. */
  transit_thumb?: "bus" | "train";
}
