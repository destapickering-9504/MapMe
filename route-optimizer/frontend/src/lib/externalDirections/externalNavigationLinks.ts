import { buildAppleMapsDirectionsUrl, type AppleMapsDirectionsBuildResult } from "./appleMapsDirectionsUrl";
import { buildGoogleMapsDirectionsUrl, type GoogleMapsDirectionsBuildResult } from "./googleMapsDirectionsUrl";
import type { ExternalDirectionsTravelModeKey } from "./travelModes";
import { buildWazeNavigateUrl, type WazeNavigateBuildResult } from "./wazeDirectionsUrl";

export type { AppleMapsDirectionsBuildResult, GoogleMapsDirectionsBuildResult, WazeNavigateBuildResult };

export interface ExternalNavigationLinks {
  google: GoogleMapsDirectionsBuildResult;
  apple: AppleMapsDirectionsBuildResult;
  waze: WazeNavigateBuildResult;
}

/** Build Google, Apple Maps, and Waze links for the same ordered route (driving/walking subset via travel key). */
export function buildExternalNavigationLinks(
  points: { lat: number; lng: number }[],
  travelModeKey: ExternalDirectionsTravelModeKey
): ExternalNavigationLinks | null {
  const google = buildGoogleMapsDirectionsUrl(points, travelModeKey);
  const apple = buildAppleMapsDirectionsUrl(points, travelModeKey);
  const waze = buildWazeNavigateUrl(points);
  if (!google || !apple || !waze) return null;
  return { google, apple, waze };
}
