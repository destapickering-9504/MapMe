import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteSavedTrip,
  listSavedTrips,
  setSavedTripFavorite,
  updateSavedTrip,
  type SavedTripRow
} from "../api/savedTripsClient";
import { useAuth } from "../auth/AuthContext";
import type { OptimizeResponse } from "../domain/routeTypes";
import { ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import { RESTORE_TRIP_STATE_KEY } from "./RouteOptimizerPage";

const PAGE_SIZE = 10;

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function summarizePayload(p: OptimizeResponse): string {
  const n = p.stops_resolved?.length ?? 0;
  const mins = p.best_route?.total_minutes?.toFixed(1) ?? "—";
  return `${n} stop${n === 1 ? "" : "s"} · ~${mins} min`;
}

function rowMatchesName(row: SavedTripRow, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const title = (row.title ?? "").toLowerCase();
  const origin = (row.payload?.origin_query ?? "").toLowerCase();
  return title.includes(q) || origin.includes(q);
}

function rowMatchesDateTime(row: SavedTripRow, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const formatted = formatWhen(row.created_at).toLowerCase();
  const iso = row.created_at.toLowerCase();
  let shortDate = "";
  try {
    shortDate = new Date(row.created_at).toLocaleDateString(undefined).toLowerCase();
  } catch {
    /* ignore */
  }
  return formatted.includes(q) || iso.includes(q) || shortDate.includes(q);
}

export default function RouteHistoryPage() {
  const navigate = useNavigate();
  const { user, configured } = useAuth();
  const [rows, setRows] = useState<SavedTripRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [dateTimeFilter, setDateTimeFilter] = useState("");
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    if (!user || !configured) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listSavedTrips();
      setRows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user, configured]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredRows = useMemo(() => {
    return rows.filter(
      (row) => rowMatchesName(row, nameFilter) && rowMatchesDateTime(row, dateTimeFilter)
    );
  }, [rows, nameFilter, dateTimeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  useEffect(() => {
    setPage(1);
  }, [nameFilter, dateTimeFilter]);

  const openInPlanner = (row: SavedTripRow) => {
    navigate(ROUTE_OPTIMIZER_PATH, {
      state: { [RESTORE_TRIP_STATE_KEY]: row.payload }
    });
  };

  const startRename = (row: SavedTripRow) => {
    setEditingId(row.id);
    setEditTitle(row.title ?? "");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveRename = async (id: string) => {
    setError(null);
    try {
      await updateSavedTrip(id, editTitle);
      cancelRename();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteSavedTrip(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleFavorite = async (row: SavedTripRow) => {
    setError(null);
    try {
      await setSavedTripFavorite(row.id, !row.is_favorite);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update favorite");
    }
  };

  const showTableShell = configured && user;

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="route-history-table-empty">
            Loading…
          </td>
        </tr>
      );
    }
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="route-history-table-empty">
            No routes yet.{" "}
            <Link to={ROUTE_OPTIMIZER_PATH}>Plan a route</Link> — it will appear here after you optimize.
          </td>
        </tr>
      );
    }
    if (filteredRows.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="route-history-table-empty">
            No routes match your search. Try different name or date/time filters.
          </td>
        </tr>
      );
    }
    return pageRows.map((row) => (
      <tr key={row.id}>
        <td className="route-history-table-favorite">
          <button
            type="button"
            className={
              row.is_favorite ? "route-history-star route-history-star-on" : "route-history-star"
            }
            aria-pressed={row.is_favorite}
            aria-label={row.is_favorite ? "Remove from favorites" : "Add to favorites"}
            title={row.is_favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => void toggleFavorite(row)}
          >
            {row.is_favorite ? "★" : "☆"}
          </button>
        </td>
        <td className="route-history-table-name">
          {editingId === row.id ? (
            <div className="route-history-table-rename">
              <input
                type="text"
                className="auth-flow-input route-history-table-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                aria-label="Route name"
                placeholder="Route name"
              />
              <div className="route-history-rename-actions">
                <button type="button" className="saved-trips-linkish" onClick={() => void saveRename(row.id)}>
                  Save
                </button>
                <button type="button" className="saved-trips-linkish" onClick={cancelRename}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="route-history-table-name-cell">
              <span className="route-history-table-title">{row.title ?? "Untitled route"}</span>
              <button type="button" className="saved-trips-linkish" onClick={() => startRename(row)}>
                Rename
              </button>
            </div>
          )}
        </td>
        <td className="route-history-table-date">{formatWhen(row.created_at)}</td>
        <td className="route-history-table-summary">{summarizePayload(row.payload)}</td>
        <td className="route-history-table-start">{row.payload.origin_query}</td>
        <td className="route-history-table-actions">
          <button type="button" className="saved-trips-linkish" onClick={() => openInPlanner(row)}>
            Open
          </button>
          <button type="button" className="saved-trips-linkish danger" onClick={() => void handleDelete(row.id)}>
            Delete
          </button>
        </td>
      </tr>
    ));
  };

  if (!configured) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">History</h1>
        <p className="muted-small">
          Add Supabase env vars to sync your history across devices.
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">History</h1>
        <p className="muted-small">
          <Link to="/">Sign in</Link> to see routes you&apos;ve run while signed in.
        </p>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">History</h1>
      </div>

      {error ? (
        <p className="status-text error-text" role="alert">
          {error}
        </p>
      ) : null}

      {showTableShell ? (
        <>
          <div className="route-history-filters planner-card">
            <label className="route-history-filter">
              <span className="auth-flow-label-text">Search route / planner name or start</span>
              <input
                type="search"
                className="auth-flow-input"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="e.g. Sunday shopping, 94102"
                aria-label="Search by route name or start location"
              />
            </label>
            <label className="route-history-filter">
              <span className="auth-flow-label-text">Search date / time</span>
              <input
                type="search"
                className="auth-flow-input"
                value={dateTimeFilter}
                onChange={(e) => setDateTimeFilter(e.target.value)}
                placeholder="e.g. Mar 2026, 3:45 PM, 2026-03-26"
                aria-label="Filter by created date or time text"
              />
            </label>
          </div>

          <div className="route-history-table-wrap">
            <table className="route-history-table">
              <caption className="sr-only">Saved routes</caption>
              <thead>
                <tr>
                  <th scope="col">Favorite</th>
                  <th scope="col">Route name</th>
                  <th scope="col">Created</th>
                  <th scope="col">Summary</th>
                  <th scope="col">Start</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>{renderTableBody()}</tbody>
            </table>
          </div>

          {!loading && rows.length > 0 && filteredRows.length > 0 ? (
            <div className="route-history-pagination" role="navigation" aria-label="History pages">
              <span className="route-history-page-info">
                Page {safePage} of {totalPages} ({filteredRows.length} route{filteredRows.length === 1 ? "" : "s"}
                {filteredRows.length !== rows.length ? ` of ${rows.length} total` : ""})
              </span>
              <div className="route-history-page-buttons">
                <button
                  type="button"
                  className="auth-flow-secondary route-history-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="auth-flow-secondary route-history-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
