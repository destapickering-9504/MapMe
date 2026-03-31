/** Backend origin for REST calls (optimize, geocode suggest). Override with VITE_API_URL when not on localhost. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:8000";
}
