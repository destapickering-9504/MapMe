import type { LatLngExpression } from "leaflet";

import type { OptimizeResponse } from "../../domain/routeTypes";
import { linePositionsForRouteIndex } from "../../map/routeSelection";
import { planDirectionsLegs } from "./directionsLegPlan";
import {
  EXTERNAL_DIRECTIONS_TRAVEL_MODES,
  type ExternalDirectionsTravelModeKey
} from "./travelModes";

function latLngFromExpression(p: LatLngExpression): { lat: number; lng: number } | null {
  if (Array.isArray(p)) {
    const lat = Number(p[0]);
    const lng = Number(p[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }
  if (typeof p === "object" && p !== null && "lat" in p && "lng" in p) {
    const lat = Number((p as { lat: number }).lat);
    const lng = Number((p as { lng: number }).lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }
  return null;
}

/** Ordered coordinates for the selected route option (same path as the in-app map polyline). */
export function orderedLatLngPointsForExternalDirections(
  result: OptimizeResponse,
  selectedRouteIndex: number
): { lat: number; lng: number }[] {
  return linePositionsForRouteIndex(result, selectedRouteIndex)
    .map(latLngFromExpression)
    .filter((x): x is { lat: number; lng: number } => x != null);
}

export interface GoogleMapsDirectionsBuildResult {
  url: string;
  /** True when intermediate stops were dropped to satisfy Google’s waypoint limit. */
  truncated: boolean;
}

/**
 * Builds a Google Maps directions URL for the given ordered points and travel subset.
 * When there are too many intermediate stops, falls back to origin → destination only.
 */
export function buildGoogleMapsDirectionsUrl(
  points: { lat: number; lng: number }[],
  travelModeKey: ExternalDirectionsTravelModeKey
): GoogleMapsDirectionsBuildResult | null {
  const { googleTravelMode, maxIntermediateWaypoints } = EXTERNAL_DIRECTIONS_TRAVEL_MODES[travelModeKey];
  const plan = planDirectionsLegs(points, maxIntermediateWaypoints);
  if (!plan) return null;

  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("origin", `${plan.origin.lat},${plan.origin.lng}`);
  params.set("destination", `${plan.destination.lat},${plan.destination.lng}`);
  params.set("travelmode", googleTravelMode);
  if (plan.waypoints.length > 0) {
    params.set("waypoints", plan.waypoints.map((p) => `${p.lat},${p.lng}`).join("|"));
  }

  return {
    url: `https://www.google.com/maps/dir/?${params.toString()}`,
    truncated: plan.truncated
  };
}
