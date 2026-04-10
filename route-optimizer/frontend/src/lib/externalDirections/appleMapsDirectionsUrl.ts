import { planDirectionsLegs } from "./directionsLegPlan";
import {
  EXTERNAL_DIRECTIONS_TRAVEL_MODES,
  type ExternalDirectionsTravelModeKey
} from "./travelModes";

export interface AppleMapsDirectionsBuildResult {
  url: string;
  truncated: boolean;
}

/**
 * Apple Maps web URL: `saddr` + repeated `daddr` for each leg end (intermediates then destination).
 * @see https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
 */
export function buildAppleMapsDirectionsUrl(
  points: { lat: number; lng: number }[],
  travelModeKey: ExternalDirectionsTravelModeKey
): AppleMapsDirectionsBuildResult | null {
  const { maxIntermediateWaypoints, appleDirflg } = EXTERNAL_DIRECTIONS_TRAVEL_MODES[travelModeKey];
  const plan = planDirectionsLegs(points, maxIntermediateWaypoints);
  if (!plan) return null;

  const params = new URLSearchParams();
  params.set("saddr", `${plan.origin.lat},${plan.origin.lng}`);
  for (const p of [...plan.waypoints, plan.destination]) {
    params.append("daddr", `${p.lat},${p.lng}`);
  }
  params.set("dirflg", appleDirflg);

  return {
    url: `https://maps.apple.com/?${params.toString()}`,
    truncated: plan.truncated
  };
}
