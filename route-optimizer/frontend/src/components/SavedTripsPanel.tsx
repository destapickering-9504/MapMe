import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listSavedTripsPage, setSavedTripFavorite, type SavedTripRow } from "../api/savedTripsClient";
import type { OptimizeResponse } from "../domain/routeTypes";
import { useAuth } from "../auth/AuthContext";
import { ROUTE_HISTORY_PATH } from "../routes/paths";

interface Props {
  currentResult: OptimizeResponse | null;
  onLoadTrip: (row: SavedTripRow) => void;
  /** Increment to refetch favorites list (e.g. after starring from the map summary). */
  listRefreshToken?: number;
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

/** Legacy rows stored `"{query} · {same as formatWhen(created_at)}"` — show the query once and keep date on the meta line only. */
function favoriteRouteTitle(row: SavedTripRow): string {
  const raw = (row.title ?? "").trim() || "Route";
  const suffix = ` · ${formatWhen(row.created_at)}`;
  if (raw.endsWith(suffix)) {
    const stripped = raw.slice(0, -suffix.length).trim();
    return stripped || "Route";
  }
  return raw;
}

export default function SavedTripsPanel({
  currentResult: _currentResult,
  onLoadTrip,
  listRefreshToken = 0
}: Props) {
  const { user, configured } = useAuth();
  const [rows, setRows] = useState<SavedTripRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !configured) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { rows: list } = await listSavedTripsPage({
        limit: 100,
        offset: 0,
        savedOnly: true,
        newestFirst: true
      });
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load favorites");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user, configured]);

  useEffect(() => {
    void refresh();
  }, [refresh, listRefreshToken]);

  const favorites = useMemo(() => rows.filter((r) => r.is_favorite), [rows]);

  const handleLoad = (row: SavedTripRow) => {
    onLoadTrip(row);
  };

  const handleUnstar = async (id: string) => {
    setError(null);
    try {
      await setSavedTripFavorite(id, false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update favorite");
    }
  };

  if (!configured) {
    return (
      <section className="saved-trips-card">
        <h3 className="section-spaced">Favorite routes</h3>
        <p className="muted-small">
          Add <code className="inline-code">VITE_SUPABASE_URL</code> and{" "}
          <code className="inline-code">VITE_SUPABASE_ANON_KEY</code> to enable favorites.
        </p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="saved-trips-card">
        <h3 className="section-spaced">Favorite routes</h3>
        <p className="muted-small">
          <Link to="/">Sign in</Link> to star routes from{" "}
          <Link to={ROUTE_HISTORY_PATH}>History</Link> and see them here.
        </p>
      </section>
    );
  }

  return (
    <section className="saved-trips-card">
      <h3 className="section-spaced">Favorite routes</h3>
      {error ? (
        <p className="status-text error-text" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="muted-small">Loading…</p> : null}
      {!loading && favorites.length > 0 ? (
        <>
          <p className="muted-small">
            Star from the route summary on the map or in <Link to={ROUTE_HISTORY_PATH}>History</Link>.
          </p>
          <ul className="saved-trips-list">
            {favorites.map((row) => (
              <li key={row.id} className="saved-trips-row">
                <div className="saved-trips-row-main">
                  <span className="saved-trips-title" title="Favorite">
                    ★ {favoriteRouteTitle(row)}
                  </span>
                  <span className="saved-trips-meta">{formatWhen(row.created_at)}</span>
                </div>
                <div className="saved-trips-actions">
                  <button type="button" className="saved-trips-linkish" onClick={() => handleLoad(row)}>
                    Load
                  </button>
                  <button
                    type="button"
                    className="saved-trips-linkish"
                    onClick={() => void handleUnstar(row.id)}
                  >
                    Unstar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
