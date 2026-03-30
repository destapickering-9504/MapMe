import type { User } from "@supabase/supabase-js";

export const TRAVEL_ORDER = ["driving", "walking", "transit"] as const;
export type TravelMode = (typeof TRAVEL_ORDER)[number];

export function sortTravelModes(modes: Iterable<TravelMode | string>): TravelMode[] {
  const set = new Set(modes as Iterable<string>);
  return TRAVEL_ORDER.filter((id) => set.has(id));
}

/** Toggle one mode; at least one mode always stays selected. */
export function toggleTravelMode(current: TravelMode[], id: TravelMode): TravelMode[] {
  const set = new Set(current);
  if (set.has(id)) {
    if (set.size <= 1) return current;
    set.delete(id);
  } else {
    set.add(id);
  }
  return sortTravelModes(set);
}

/** True when the user has already finished the post-auth name + travel step (stored in JWT metadata). */
export function isOnboardingComplete(user: User | null | undefined): boolean {
  if (!user) return false;
  const meta = user.user_metadata;
  const name = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  if (!name) return false;
  const raw = meta.travel_modes;
  if (!Array.isArray(raw) || raw.length === 0) return false;
  return raw.some((m) => typeof m === "string" && (TRAVEL_ORDER as readonly string[]).includes(m));
}

export function readOnboardingFromUser(user: User): { fullName: string; travelModes: TravelMode[] } {
  const meta = user.user_metadata;
  const fullName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const raw = meta.travel_modes;
  let travelModes: TravelMode[] = ["driving"];
  if (Array.isArray(raw)) {
    const parsed = raw.filter(
      (m): m is TravelMode => typeof m === "string" && (TRAVEL_ORDER as readonly string[]).includes(m)
    );
    if (parsed.length) travelModes = sortTravelModes(parsed);
  }
  return { fullName, travelModes };
}
