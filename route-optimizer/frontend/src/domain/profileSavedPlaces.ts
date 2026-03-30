import {
  parseSavedLocations,
  type SavedLocation
} from "./savedLocations";
import { computeStartLocationQuery, parseSavedStartLocations } from "./savedStartLocations";

/** One list for profile + planner: usable as trip start or as a stop (with address). */
export type ProfileSavedPlace = {
  id: string;
  label: string;
  address: string;
  /** Origin-style string for geocoding when used as start. */
  query: string;
};

export function createProfileSavedPlaceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `place-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeFromArray(raw: unknown): ProfileSavedPlace[] {
  if (!Array.isArray(raw)) return [];
  const out: ProfileSavedPlace[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const address = typeof o.address === "string" ? o.address.trim() : "";
    const qStored = typeof o.query === "string" ? o.query.trim() : "";
    let id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
    if (!id) id = createProfileSavedPlaceId();
    const resolvedLabel = label || "Saved";
    const addr = address.trim();
    let finalQuery: string;
    if (addr) {
      finalQuery = computeStartLocationQuery(resolvedLabel, addr);
    } else if (qStored) {
      finalQuery = qStored;
    } else {
      continue;
    }
    out.push({ id, label: resolvedLabel, address, query: finalQuery });
  }
  return out;
}

function placeDedupeKey(label: string, address: string): string {
  return `${label.trim().toLowerCase()}\n${address.trim().toLowerCase()}`;
}

function mergeLegacyStartsStops(meta: Record<string, unknown>): ProfileSavedPlace[] {
  const starts = parseSavedStartLocations(meta);
  const stops = parseSavedLocations(meta);
  const out: ProfileSavedPlace[] = [];
  const seen = new Set<string>();
  const usedIds = new Set<string>();

  const push = (id: string, label: string, address: string, query: string) => {
    const key = placeDedupeKey(label, address);
    if (seen.has(key)) return;
    seen.add(key);
    let fid = id;
    if (usedIds.has(fid)) {
      fid = createProfileSavedPlaceId();
    }
    usedIds.add(fid);
    out.push({
      id: fid,
      label: label.trim() || "Saved",
      address: address.trim(),
      query: query.trim() || computeStartLocationQuery(label, address)
    });
  };

  for (const s of starts) {
    const q = s.query.trim() || computeStartLocationQuery(s.label, s.address);
    push(s.id, s.label, s.address, q);
  }
  for (const s of stops) {
    push(s.id, s.name, s.address, computeStartLocationQuery(s.name, s.address));
  }
  return out;
}

/**
 * Reads `user_metadata.saved_places`. If that key was never set, builds one list from
 * legacy `saved_start_locations` + `saved_locations` / `saved_stores` (deduped by label+address).
 */
export function parseProfileSavedPlaces(meta: Record<string, unknown> | undefined | null): ProfileSavedPlace[] {
  if (!meta) return [];
  if (Object.prototype.hasOwnProperty.call(meta, "saved_places")) {
    return normalizeFromArray(meta.saved_places);
  }
  return mergeLegacyStartsStops(meta);
}

export function toProfileSavedPlacesPayload(
  places: ProfileSavedPlace[]
): Array<{ id: string; label: string; address: string; query: string }> {
  return places.map(({ id, label, address, query }) => ({ id, label, address, query }));
}

/** Payload keys written on save: canonical list + empty legacy arrays so old clients don’t double-read. */
export function profileSavedPlacesUserDataUpdate(places: ProfileSavedPlace[]): Record<string, unknown> {
  return {
    saved_places: toProfileSavedPlacesPayload(places),
    saved_start_locations: [],
    saved_locations: []
  };
}

export function profilePlaceToOriginQuery(p: ProfileSavedPlace): string {
  const a = p.address.trim();
  if (a) return computeStartLocationQuery(p.label, a);
  return p.query.trim();
}
