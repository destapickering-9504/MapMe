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

export async function listSavedTrips(): Promise<SavedTripRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("saved_trips")
    .select("id,user_id,title,payload,created_at,is_favorite")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => normalizeRow(r as Record<string, unknown>));
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
