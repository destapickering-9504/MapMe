/**
 * External turn-by-turn apps (Google Maps, etc.) keyed by the same concepts we use for
 * OptimizeResponse.transport_mode. Add modes here first; then wire UI + API when ready.
 */
export const EXTERNAL_DIRECTIONS_TRAVEL_MODES = {
  driving: {
    googleTravelMode: "driving" as const,
    /** Google Maps URL directions: max intermediate stops between origin and destination. */
    maxIntermediateWaypoints: 9,
    /** Apple Maps `dirflg`: driving. */
    appleDirflg: "d" as const
  },
  walking: {
    googleTravelMode: "walking" as const,
    maxIntermediateWaypoints: 9,
    appleDirflg: "w" as const
  }
} as const;

export type ExternalDirectionsTravelModeKey = keyof typeof EXTERNAL_DIRECTIONS_TRAVEL_MODES;

/** Maps persisted / API transport_mode to external directions config. Transit → omit until implemented. */
export function externalDirectionsTravelModeKeyFromResult(transportMode: string | null | undefined): "driving" | "walking" {
  if (transportMode === "walking") return "walking";
  return "driving";
}
