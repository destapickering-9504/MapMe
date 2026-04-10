export interface LatLng {
  lat: number;
  lng: number;
}

export interface DirectionsLegPlan {
  origin: LatLng;
  destination: LatLng;
  waypoints: LatLng[];
  /** True when intermediate stops were dropped (too many for the provider). */
  truncated: boolean;
}

/**
 * Splits an ordered point list into origin, intermediates, and destination.
 * If there are more than `maxIntermediateWaypoints` intermediates, drops all intermediates
 * (origin → destination only) and sets `truncated`.
 */
export function planDirectionsLegs(
  points: LatLng[],
  maxIntermediateWaypoints: number
): DirectionsLegPlan | null {
  if (points.length < 2) return null;

  const origin = points[0];
  const destination = points[points.length - 1];
  const intermediates = points.slice(1, -1);

  if (intermediates.length <= maxIntermediateWaypoints) {
    return { origin, destination, waypoints: intermediates, truncated: false };
  }

  return { origin, destination, waypoints: [], truncated: true };
}
