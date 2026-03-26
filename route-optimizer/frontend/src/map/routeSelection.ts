import type { GeoJsonLineString, OptimizeResponse, RouteOption } from "../domain/routeTypes";
import type { LatLngExpression } from "leaflet";

export function routeOptionByIndex(result: OptimizeResponse, index: number): RouteOption {
  if (index <= 0) return result.best_route;
  return result.alternatives[index - 1] ?? result.best_route;
}

export function routeOptionCount(result: OptimizeResponse): number {
  return 1 + result.alternatives.length;
}

export function geoJsonForRouteIndex(result: OptimizeResponse, index: number): GeoJsonLineString | null {
  const opts = result.route_geojson_options;
  if (opts && index >= 0 && index < opts.length && opts[index] != null) {
    return opts[index] as GeoJsonLineString;
  }
  if (index === 0 && result.best_route_geojson) {
    return result.best_route_geojson;
  }
  return null;
}

export function linePositionsForRouteIndex(result: OptimizeResponse, selectedIndex: number): LatLngExpression[] {
  const g = geoJsonForRouteIndex(result, selectedIndex);
  if (g && g.type === "LineString" && Array.isArray(g.coordinates)) {
    return g.coordinates.map((pair) => {
      if (!Array.isArray(pair) || pair.length < 2) {
        return [0, 0] as LatLngExpression;
      }
      const lng = Number(pair[0]);
      const lat = Number(pair[1]);
      return [lat, lng] as LatLngExpression;
    });
  }
  const opt = routeOptionByIndex(result, selectedIndex);
  const pts: LatLngExpression[] = [[result.origin_lat, result.origin_lng]];
  for (const s of opt.ordered_stops) {
    pts.push([s.lat, s.lng]);
  }
  if (
    result.destination_lat != null &&
    result.destination_lng != null &&
    !Number.isNaN(result.destination_lat) &&
    !Number.isNaN(result.destination_lng)
  ) {
    pts.push([result.destination_lat, result.destination_lng]);
  } else if (result.trip_mode === "round_trip") {
    pts.push([result.origin_lat, result.origin_lng]);
  }
  return pts;
}
