import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlannerRefSidebar } from "../components/PlannerRefSidebar";
import {
  deleteSavedTrip,
  listSavedTripsPage,
  setSavedTripFavorite,
  updateSavedTrip,
  type SavedTripRow
} from "../api/savedTripsClient";
import { useAuth } from "../auth/AuthContext";
import type { OptimizeResponse } from "../domain/routeTypes";
import { PROFILE_PATH, ROUTE_HISTORY_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import { RESTORE_TRIP_STATE_KEY } from "./RouteOptimizerPage";
import { DeleteRouteConfirmModal } from "./history/DeleteRouteConfirmModal";
import { HistoryHeader } from "./history/HistoryHeader";
import { rowToViewModel } from "./history/historyMappers";
import "./history/history.tailwind.css";
import "./history/historyRef.css";
import { mockListSavedTripsPage } from "./history/mockData";
import { RouteCard, RouteCardSkeleton } from "./history/RouteCard";
import { SearchAndFilterBar } from "./history/SearchAndFilterBar";
import { historyRoutesSectionMeta } from "./history/historySectionTitle";
import { SectionHeader } from "./history/SectionHeader";
import type { HistoryRouteViewModel, RouteTransportMode } from "./history/types";

const PAGE_SIZE = 5;

/** Set true to preview the card UI with bundled mock rows (no API). */
const USE_HISTORY_MOCK = false;

export default function RouteHistoryPage() {
  const navigate = useNavigate();
  const { user, configured } = useAuth();
  const [rows, setRows] = useState<SavedTripRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);
  const [routeTypeFilter, setRouteTypeFilter] = useState<RouteTransportMode | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(nameFilter), 350);
    return () => window.clearTimeout(t);
  }, [nameFilter]);

  const listQuery = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      savedOnly: filterSavedOnly,
      transportMode: routeTypeFilter,
      newestFirst: sortNewestFirst
    }),
    [debouncedSearch, filterSavedOnly, routeTypeFilter, sortNewestFirst]
  );

  useEffect(() => {
    let cancelled = false;
    if (USE_HISTORY_MOCK) {
      setLoading(true);
      const res = mockListSavedTripsPage({
        limit: PAGE_SIZE,
        offset: 0,
        ...listQuery
      });
      if (!cancelled) {
        setRows(res.rows);
        setTotalCount(res.totalCount);
        setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }
    if (!user || !configured) {
      setRows([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await listSavedTripsPage({
          limit: PAGE_SIZE,
          offset: 0,
          ...listQuery
        });
        if (!cancelled) {
          setRows(res.rows);
          setTotalCount(res.totalCount);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load history");
          setRows([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, configured, listQuery, USE_HISTORY_MOCK]);

  const reloadFirstPage = useCallback(async () => {
    if (USE_HISTORY_MOCK) {
      const res = mockListSavedTripsPage({ limit: PAGE_SIZE, offset: 0, ...listQuery });
      setRows(res.rows);
      setTotalCount(res.totalCount);
      return;
    }
    if (!user || !configured) return;
    setError(null);
    try {
      const res = await listSavedTripsPage({ limit: PAGE_SIZE, offset: 0, ...listQuery });
      setRows(res.rows);
      setTotalCount(res.totalCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
    }
  }, [user, configured, listQuery, USE_HISTORY_MOCK]);

  const loadMore = useCallback(async () => {
    if (rows.length >= totalCount || loadingMore) return;
    if (USE_HISTORY_MOCK) {
      setLoadingMore(true);
      const res = mockListSavedTripsPage({
        limit: PAGE_SIZE,
        offset: rows.length,
        ...listQuery
      });
      setRows((prev) => [...prev, ...res.rows]);
      setTotalCount(res.totalCount);
      setLoadingMore(false);
      return;
    }
    if (!user || !configured) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listSavedTripsPage({
        limit: PAGE_SIZE,
        offset: rows.length,
        ...listQuery
      });
      setRows((prev) => [...prev, ...res.rows]);
      setTotalCount(res.totalCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more");
    } finally {
      setLoadingMore(false);
    }
  }, [rows.length, totalCount, loadingMore, user, configured, listQuery, USE_HISTORY_MOCK]);

  const viewModels = useMemo(() => rows.map(rowToViewModel), [rows]);

  const openInPlanner = (payload: OptimizeResponse) => {
    navigate(ROUTE_OPTIMIZER_PATH, {
      state: { [RESTORE_TRIP_STATE_KEY]: payload }
    });
  };

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
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
      await reloadFirstPage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed");
    }
  };

  const confirmDeleteRoute = async () => {
    if (!deleteConfirm) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteSavedTrip(deleteConfirm.id);
      setDeleteConfirm(null);
      await reloadFirstPage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleFavorite = async (id: string, next: boolean) => {
    setError(null);
    try {
      await setSavedTripFavorite(id, next);
      await reloadFirstPage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update favorite");
    }
  };

  const renderCard = (route: HistoryRouteViewModel) => (
    <li key={route.id}>
      <RouteCard
        route={route}
        editing={editingId === route.id}
        editTitle={editTitle}
        onEditTitleChange={setEditTitle}
        onStartRename={() => startRename(route.id, route.title)}
        onSaveRename={() => void saveRename(route.id)}
        onCancelRename={cancelRename}
        onOpen={() => openInPlanner(route.payload)}
        onToggleSave={() => void toggleFavorite(route.id, !route.isFavorite)}
        onDelete={() => setDeleteConfirm({ id: route.id, title: route.title })}
      />
    </li>
  );

  if (!configured && !USE_HISTORY_MOCK) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">History</h1>
        <p className="muted-small">
          Add Supabase env vars to sync your history across devices.
        </p>
      </main>
    );
  }

  if (!user && !USE_HISTORY_MOCK) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">History</h1>
        <p className="muted-small">
          <Link to="/">Sign in</Link> to see routes you&apos;ve run while signed in.
        </p>
      </main>
    );
  }

  const showShell = USE_HISTORY_MOCK || (configured && Boolean(user));
  const hasActiveFilters = Boolean(
    debouncedSearch.trim() || filterSavedOnly || routeTypeFilter
  );
  const listEmpty = !loading && totalCount === 0 && !hasActiveFilters;
  const noResults = !loading && totalCount === 0 && hasActiveFilters;
  const sectionMeta = historyRoutesSectionMeta(filterSavedOnly, routeTypeFilter);

  return (
    <main className="history-ref-layout-shell app-page-history-ref">
      <div className="hm-history-root hm-ref hm-ref-page-with-sidebar">
        <PlannerRefSidebar surface="history" />
        <div className="hm-ref-sidebar-main">
          <div className="hm-ref-sidebar-main-inner app-page-history-shell">
            <div className="hm-ref-mobile-tabs" aria-label="Navigate">
              <Link to={ROUTE_OPTIMIZER_PATH}>Planner</Link>
              <Link to={ROUTE_HISTORY_PATH}>History</Link>
              <Link to={PROFILE_PATH}>Profile</Link>
            </div>

            <HistoryHeader />

            {error ? (
              <p className="status-text error-text mb-6" role="alert">
                {error}
              </p>
            ) : null}

            {showShell ? (
              <>
            <SearchAndFilterBar
              searchQuery={nameFilter}
              onSearchChange={setNameFilter}
              filterSavedOnly={filterSavedOnly}
              onToggleSavedOnly={() => setFilterSavedOnly((v) => !v)}
              routeTypeFilter={routeTypeFilter}
              onRouteTypeChange={setRouteTypeFilter}
              sortNewestFirst={sortNewestFirst}
              onSortNewestFirst={setSortNewestFirst}
            />

            {loading ? (
              <ul className="hm-ref-card-list" aria-busy="true" aria-label="Loading routes">
                <li>
                  <RouteCardSkeleton />
                </li>
                <li>
                  <RouteCardSkeleton />
                </li>
                <li>
                  <RouteCardSkeleton />
                </li>
              </ul>
            ) : null}

            {listEmpty ? (
              <div className="hm-ref-empty">
                <p className="hm-ref-empty-title">No routes yet</p>
                <p className="hm-ref-empty-text">
                  <Link to={ROUTE_OPTIMIZER_PATH}>Plan a route</Link> — it will show up here after you optimize.
                </p>
              </div>
            ) : null}

            {noResults ? (
              <div className="hm-ref-empty">
                <p className="hm-ref-empty-title">
                  {filterSavedOnly ? "No saved routes" : "No routes match"}
                </p>
                <p className="hm-ref-empty-text">
                  {filterSavedOnly
                    ? "Turn off Saved or clear other filters to see matching routes."
                    : "Try clearing filters or searching with a different name or place."}
                </p>
              </div>
            ) : null}

            {!loading && viewModels.length > 0 ? (
              <section aria-labelledby={sectionMeta.id}>
                <SectionHeader id={sectionMeta.id} title={sectionMeta.title} count={totalCount} />
                <ul className="hm-ref-card-list">
                  {viewModels.map((r) => renderCard(r))}
                </ul>
                {totalCount > PAGE_SIZE || rows.length < totalCount ? (
                  <div className="hm-ref-load-wrap">
                    <p className="hm-ref-muted-caption">
                      Showing {rows.length} of {totalCount}
                    </p>
                    {rows.length < totalCount ? (
                      <button
                        type="button"
                        className="hm-ref-btn-load"
                        disabled={loadingMore}
                        onClick={() => void loadMore()}
                      >
                        {loadingMore ? "Loading…" : "Load more"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}
              </>
            ) : null}
          </div>
        </div>

        <DeleteRouteConfirmModal
          open={deleteConfirm !== null}
          routeTitle={deleteConfirm?.title ?? ""}
          busy={deleteBusy}
          onCancel={() => {
            if (!deleteBusy) setDeleteConfirm(null);
          }}
          onConfirm={() => void confirmDeleteRoute()}
        />
      </div>
    </main>
  );
}
