export type SavedStartLocation = {
  id: string;
  /** Display name (Home, Work, custom, etc.) */
  label: string;
  /** Address / neighborhood / ZIP line */
  address: string;
  /** Value sent as origin_place for geocoding (address when set; label-only is legacy / rare). */
  query: string;
};

export function createSavedStartLocationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeFromArray(raw: unknown): SavedStartLocation[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedStartLocation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const address = typeof o.address === "string" ? o.address.trim() : "";
    const qStored = typeof o.query === "string" ? o.query.trim() : "";
    let id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
    if (!id) id = createSavedStartLocationId();
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

/** Read saved starts from Supabase `user_metadata`; migrates legacy `start_location` only if the new key was never set. */
export function parseSavedStartLocations(
  meta: Record<string, unknown> | undefined | null
): SavedStartLocation[] {
  if (!meta) return [];
  if (Object.prototype.hasOwnProperty.call(meta, "saved_start_locations")) {
    return normalizeFromArray(meta.saved_start_locations);
  }
  const legacy = meta.start_location;
  if (typeof legacy === "string" && legacy.trim()) {
    const q = legacy.trim();
    return [{ id: "migrated", label: "Home", address: "", query: q }];
  }
  return [];
}

export function toMetadataPayload(
  locations: SavedStartLocation[]
): Array<{ id: string; label: string; address: string; query: string }> {
  return locations.map(({ id, label, address, query }) => ({ id, label, address, query }));
}

/**
 * Build the optimize API origin string. Use the address line alone when present so geocoders
 * get a normal place query (Nominatim often fails on "Home, 123 Main St, City…").
 */
export function computeStartLocationQuery(label: string, address: string): string {
  const a = address.trim();
  if (a) return a;
  return label.trim();
}

/** Origin string for the planner input when a saved start is selected. */
export function savedStartToOriginQuery(s: SavedStartLocation): string {
  const a = s.address.trim();
  if (a) return computeStartLocationQuery(s.label, a);
  return s.query.trim();
}
