export type SavedLocation = {
  id: string;
  name: string;
  address: string;
};

export function createSavedLocationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeFromArray(raw: unknown): SavedLocation[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedLocation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const address = typeof o.address === "string" ? o.address.trim() : "";
    let id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
    if (!id) id = createSavedLocationId();
    if (!name || !address) continue;
    out.push({ id, name, address });
  }
  return out;
}

/**
 * Reads `user_metadata.saved_locations`, or legacy `saved_stores` if the new key was never set.
 */
export function parseSavedLocations(meta: Record<string, unknown> | undefined | null): SavedLocation[] {
  if (!meta) return [];
  if (Array.isArray(meta.saved_locations)) {
    return normalizeFromArray(meta.saved_locations);
  }
  if (Array.isArray(meta.saved_stores)) {
    return normalizeFromArray(meta.saved_stores);
  }
  return [];
}

export function toSavedLocationsMetadataPayload(
  locations: SavedLocation[]
): Array<{ id: string; name: string; address: string }> {
  return locations.map(({ id, name, address }) => ({ id, name, address }));
}
