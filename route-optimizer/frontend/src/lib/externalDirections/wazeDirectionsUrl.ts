/**
 * Waze universal link: navigate to a single coordinate.
 * Multi-stop routes are not represented in the public URL; we use the route’s final point.
 * @see https://developers.google.com/waze/deeplinks
 */
export interface WazeNavigateBuildResult {
  url: string;
  /** True when the full route had more than one leg (user may need to add earlier stops in Waze). */
  opensFinalStopOnly: boolean;
}

export function buildWazeNavigateUrl(points: { lat: number; lng: number }[]): WazeNavigateBuildResult | null {
  if (points.length < 2) return null;

  const destination = points[points.length - 1];
  const params = new URLSearchParams();
  params.set("ll", `${destination.lat},${destination.lng}`);
  params.set("navigate", "yes");

  return {
    url: `https://www.waze.com/ul?${params.toString()}`,
    opensFinalStopOnly: points.length > 2
  };
}
