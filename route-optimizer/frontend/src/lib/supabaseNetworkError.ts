/** User-facing hint when Supabase Auth requests fail at the network layer. */
export function describeSupabaseNetworkFailure(configuredUrl: string | undefined): string {
  const safe = configuredUrl?.trim() || "(no VITE_SUPABASE_URL set)";
  return [
    "Could not reach Supabase — the request never completed.",
    "",
    `Using: ${safe}`,
    "",
    "Checklist:",
    "• Supabase → Settings → API → copy Project URL exactly into frontend/.env.local as VITE_SUPABASE_URL.",
    "• URL should look like https://xxxx.supabase.co (no trailing slash).",
    "• Dashboard: make sure the project is running (not paused).",
    "• After editing .env.local, stop and restart npm run dev.",
    "• Try disabling VPN/ad blockers or another network briefly."
  ].join("\n");
}

export function isLikelyNetworkAuthFailure(message: string, err?: { name?: string } | null): boolean {
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) return true;
  if (err?.name === "AuthRetryableFetchError") return true;
  return false;
}
