import type { SavedTripRow } from "../../api/savedTripsClient";
import type { OptimizeResponse, StopDetail } from "../../domain/routeTypes";
import type { HistoryRouteViewModel, RouteTransportMode, StartIconKind, TransitThumbKind } from "./types";

const UNIT_OR_GENERIC = /^(apartment|apt\.?|unit|suite|ste\.?)$/i;

/**
 * Collapse geocoder-style strings ("Name, 123 Main St, City, …") to a short place label.
 * Skips leading unit lines and numeric-only segments so we prefer a human place name.
 */
export function shortPlaceName(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (!t.includes(",")) return t;

  const parts = t.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return t;

  for (const p of parts) {
    if (UNIT_OR_GENERIC.test(p)) continue;
    if (/^\d[\d\s-]*$/i.test(p)) continue;
    if (/^\d/.test(p)) continue;
    if (/\b\d{5}(-\d{4})?\b/.test(p)) continue;
    if (p.length < 2) continue;
    return p;
  }

  return parts[0];
}

function guessStartIcon(origin: string): StartIconKind {
  const o = origin.toLowerCase();
  if (/\bhome\b/.test(o)) return "home";
  if (/\bwork\b|\boffice\b/.test(o)) return "work";
  return "pin";
}

export function routeTypeFromRow(row: SavedTripRow): RouteTransportMode {
  const m = row.payload.transport_mode;
  if (m === "walking" || m === "transit") return m;
  return "driving";
}

function transitThumbFromPayload(p: OptimizeResponse, routeType: RouteTransportMode): TransitThumbKind | undefined {
  if (routeType !== "transit") return undefined;
  if (p.transit_thumb === "train" || p.transit_thumb === "bus") return p.transit_thumb;
  return undefined;
}

function labelForStop(s: StopDetail): string {
  const fromQuery = shortPlaceName((s.query ?? "").trim());
  if (fromQuery) return fromQuery;
  const fromAddr = shortPlaceName((s.address ?? "").trim());
  return fromAddr || "Stop";
}

export function summaryLineFromPayload(p: OptimizeResponse): string {
  const originRaw = (p.origin_query ?? "").trim() || (p.origin_address ?? "").trim();
  const origin = shortPlaceName(originRaw) || originRaw || "";
  const ordered = p.best_route?.ordered_stops ?? p.stops_resolved ?? [];
  const labels = ordered.map(labelForStop).filter(Boolean);
  const parts = [origin, ...labels].filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.join(" → ");
}

function formatDurationMinutes(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return "—";
  if (total < 60) return `${Math.round(total)} min`;
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatRelativeHeading(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOf(today) - startOf(d)) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays < 7) {
      return d.toLocaleDateString(undefined, { weekday: "short" });
    }
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  } catch {
    return iso;
  }
}

export function metaLineFromRow(row: SavedTripRow): string {
  const p = row.payload;
  const n = p.stops_resolved?.length ?? 0;
  const mins = p.best_route?.total_minutes;
  const dur = typeof mins === "number" ? formatDurationMinutes(mins) : "—";
  const stops = `${n} stop${n === 1 ? "" : "s"}`;
  return `${formatRelativeHeading(row.created_at)} · ${stops} · ${dur}`;
}

export function rowToViewModel(row: SavedTripRow): HistoryRouteViewModel {
  const p = row.payload;
  const originRaw = (p.origin_query ?? "").trim() || (p.origin_address ?? "").trim();
  const startLabel = shortPlaceName(originRaw) || originRaw || "Start";
  const routeType = routeTypeFromRow(row);
  return {
    id: row.id,
    title: (row.title ?? "").trim() || "Untitled route",
    summaryLine: summaryLineFromPayload(p),
    metaLine: metaLineFromRow(row),
    startLabel,
    startIcon: guessStartIcon(originRaw),
    isFavorite: row.is_favorite,
    routeType,
    transitThumb: transitThumbFromPayload(p, routeType),
    createdAt: row.created_at,
    payload: p
  };
}
