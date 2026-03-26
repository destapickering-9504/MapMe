export interface NearbyRequest {
  origin_place: string;
  search: string;
}

export interface NearbyPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_m: number;
}

export interface NearbyResponse {
  origin_query: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  search: string;
  places: NearbyPlace[];
}

export interface OptimizeRequest {
  origin_place: string;
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
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  stops_resolved: StopDetail[];
  permutations_considered: number;
  best_route: RouteOption;
  alternatives: RouteOption[];
  explanation: string;
  best_route_geojson: GeoJsonLineString | null;
  /** Polyline for each ranked option: [best, ...alternatives]. */
  route_geojson_options?: (GeoJsonLineString | null)[] | null;
  destination_query?: string | null;
  destination_address?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
}
