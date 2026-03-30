import type { OptimizeResponse } from "../domain/routeTypes";
import { supabase } from "../lib/supabaseClient";

export interface SavedTripRow {
  id: string;
  user_id: string;
  title: string | null;
  payload: OptimizeResponse;
  created_at: string;
  is_favorite: boolean;
}

export interface ListSavedTripsPageParams {
  limit?: number;
  offset?: number;
  /** Case-insensitive substring match on title, origin, and stop names (server-side). */
  search?: string;
  savedOnly?: boolean;
  transportMode?: "driving" | "walking" | "transit" | null;
  newestFirst?: boolean;
}

export interface ListSavedTripsPageResult {
  rows: SavedTripRow[];
  totalCount: number;
}

function normalizeRow(raw: Record<string, unknown>): SavedTripRow {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    title: raw.title == null ? null : String(raw.title),
    payload: raw.payload as OptimizeResponse,
    created_at: String(raw.created_at),
    is_favorite: Boolean(raw.is_favorite)
  };
}

function parsePageRpcPayload(data: unknown): ListSavedTripsPageResult {
  let parsed: unknown = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data) as unknown;
    } catch {
      return { rows: [], totalCount: 0 };
    }
  }
  if (!parsed || typeof parsed !== "object") {
    return { rows: [], totalCount: 0 };
  }
  const o = parsed as Record<string, unknown>;
  const totalRaw = o.total_count;
  const total =
    typeof totalRaw === "number" && Number.isFinite(totalRaw)
      ? totalRaw
      : typeof totalRaw === "string"
        ? Number(totalRaw)
        : 0;
  const rawRows = o.rows;
  if (!Array.isArray(rawRows)) {
    return { rows: [], totalCount: Number.isFinite(total) ? total : 0 };
  }
  return {
    totalCount: Number.isFinite(total) ? total : 0,
    rows: rawRows.map((r) => normalizeRow(r as Record<string, unknown>))
  };
}

/**
 * Paginated saved trips with optional filters. Uses Postgres RPC `list_saved_trips_page`
 * (see `supabase/schema.sql` or `supabase/functions/list_saved_trips_page.sql`).
 * Max 100 rows per request (enforced server-side).
 */
export async function listSavedTripsPage(params: ListSavedTripsPageParams = {}): Promise<ListSavedTripsPageResult> {
  if (!supabase) return { rows: [], totalCount: 0 };
  const {
    limit = 20,
    offset = 0,
    search,
    savedOnly = false,
    transportMode = null,
    newestFirst = true
  } = params;

  const { data, error } = await supabase.rpc("list_saved_trips_page", {
    p_limit: limit,
    p_offset: offset,
    p_search: search?.trim() ? search.trim() : null,
    p_saved_only: savedOnly,
    p_transport_mode: transportMode,
    p_newest_first: newestFirst
  });

  if (error) throw new Error(error.message);
  return parsePageRpcPayload(data);
}

export async function insertSavedTrip(payload: OptimizeResponse, title?: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You must be signed in to save trips");

  const { error } = await supabase.from("saved_trips").insert({
    user_id: user.id,
    title: title?.trim() || `Trip · ${payload.origin_query}`,
    payload,
    is_favorite: false
  });
  if (error) throw new Error(error.message);
}

export async function deleteSavedTrip(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("saved_trips").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateSavedTrip(id: string, title: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const trimmed = title.trim();
  const { error } = await supabase.from("saved_trips").update({ title: trimmed || null }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setSavedTripFavorite(id: string, isFavorite: boolean): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("saved_trips").update({ is_favorite: isFavorite }).eq("id", id);
  if (error) throw new Error(error.message);
}
