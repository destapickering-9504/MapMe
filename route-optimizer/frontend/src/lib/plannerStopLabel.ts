import type { StopDetail } from "../domain/routeTypes";

/**
 * Heuristic: store-style queries use the short name (text before the first comma when it’s “Name, address…”);
 * street-style queries (leading street number or PO Box) use the full resolved address.
 *
 * We intentionally do **not** treat “long string with commas” as street-style — the API often returns
 * composite queries like “Sephora, 2020, Westlake Ave, …” where the user-facing label should stay “Sephora”.
 */
export function plannerStopCommonLabel(stop: StopDetail): string {
  const q = stop.query.trim();
  if (!q) return stop.address.trim() || "—";
  const looksLikeStreetAddress = /^\d+\s/.test(q) || /^p\.?\s*o\.?\s*box\b/i.test(q);
  if (looksLikeStreetAddress) {
    return (stop.address || q).trim();
  }
  const comma = q.indexOf(",");
  if (comma > 0) return q.slice(0, comma).trim();
  return q;
}
