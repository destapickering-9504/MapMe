import type { ReactNode } from "react";
import type { HistoryRouteViewModel, StartIconKind } from "./types";
import {
  DrivingChipIcon,
  TrainThumbIcon,
  TransitChipIcon,
  WalkingChipIcon
} from "./RouteModeChipIcons";

function RouteSummaryWithSageArrows({ line }: { line: string }) {
  const parts = line.split(/\s*→\s*|\s*->\s*/u).filter((p) => p.trim().length > 0);
  if (parts.length <= 1) {
    return <p className="hm-ref-summary">{line}</p>;
  }
  return (
    <p className="hm-ref-summary">
      {parts.map((part, i) => (
        <span key={`${i}-${part.slice(0, 12)}`}>
          {i > 0 ? (
            <span className="hm-ref-arr" aria-hidden>
              →
            </span>
          ) : null}
          {part.trim()}
        </span>
      ))}
    </p>
  );
}

function StartGlyph({ kind }: { kind: StartIconKind }) {
  const common = "h-[17px] w-[17px] shrink-0";
  const stroke = "currentColor";
  if (kind === "home") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "work") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function RouteThumb({ route }: { route: HistoryRouteViewModel }) {
  let icon: ReactNode;
  let label: string;
  switch (route.routeType) {
    case "walking":
      icon = <WalkingChipIcon />;
      label = "Walking route";
      break;
    case "transit":
      if (route.transitThumb === "train") {
        icon = <TrainThumbIcon />;
        label = "Train route";
      } else {
        icon = <TransitChipIcon />;
        label = "Bus route";
      }
      break;
    default:
      icon = <DrivingChipIcon />;
      label = "Driving route";
  }
  return (
    <div className="hm-ref-thumb hm-ref-thumb--mode" role="img" aria-label={label}>
      <span className="hm-ref-thumb-icon-wrap">{icon}</span>
    </div>
  );
}

interface RouteCardProps {
  route: HistoryRouteViewModel;
  editing: boolean;
  editTitle: string;
  onEditTitleChange: (v: string) => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onOpen: () => void;
  onToggleSave: () => void;
  onDelete: () => void;
}

export function RouteCard({
  route,
  editing,
  editTitle,
  onEditTitleChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onOpen,
  onToggleSave,
  onDelete
}: RouteCardProps) {
  return (
    <article className="hm-ref-route-card" aria-label={route.title}>
      {route.isFavorite ? (
        <button
          type="button"
          className="hm-ref-corner-star"
          onClick={onToggleSave}
          aria-label="Remove from saved"
          title="Saved"
        >
          ★
        </button>
      ) : null}

      <div className="hm-ref-route-inner">
        <div className="hm-ref-col-left">
          <RouteThumb route={route} />
          {!editing ? (
            <div className="hm-ref-start-under">
              <div className="hm-ref-start-inner">
                <StartGlyph kind={route.startIcon} />
                <span>{route.startLabel}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="hm-ref-col-main">
          {editing ? (
            <div>
              <input
                type="text"
                className="hm-ref-input"
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                aria-label="Route name"
                autoFocus
              />
              <div className="hm-ref-actions" style={{ borderTop: "none", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="hm-ref-btn-mint" onClick={onSaveRename}>
                  Save name
                </button>
                <button type="button" className="hm-ref-btn-2" onClick={onCancelRename}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="hm-ref-title-row">
                <h3>{route.title}</h3>
                <button type="button" className="hm-ref-edit" onClick={onStartRename}>
                  Edit
                </button>
              </div>
              <RouteSummaryWithSageArrows line={route.summaryLine} />
              <p className="hm-ref-meta-line">{route.metaLine}</p>

              <div className="hm-ref-start-mobile hm-ref-start-inner">
                <StartGlyph kind={route.startIcon} />
                <span>{route.startLabel}</span>
              </div>

              <div className="hm-ref-actions">
                <button type="button" className="hm-ref-btn-open" onClick={onOpen}>
                  Open Route
                </button>
                <button
                  type="button"
                  className="hm-ref-btn-2"
                  onClick={onToggleSave}
                  aria-label={route.isFavorite ? "Unsave route" : "Save route"}
                  title={route.isFavorite ? "Unsave" : "Save"}
                >
                  <span className="hm-ref-star" aria-hidden>
                    {route.isFavorite ? "★" : "☆"}
                  </span>
                  <span>{route.isFavorite ? "Unsave" : "Save"}</span>
                </button>
                <button
                  type="button"
                  className="hm-ref-btn-2 hm-ref-btn-2--danger"
                  onClick={onDelete}
                  aria-label="Delete route"
                  title="Delete"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function RouteCardSkeleton() {
  return (
    <div className="hm-ref-skel" aria-hidden>
      <div className="hm-ref-route-inner">
        <div className="hm-ref-col-left">
          <div className="hm-ref-thumb animate-pulse" style={{ background: "var(--ref-2nd)" }} />
        </div>
        <div className="hm-ref-col-main" style={{ gap: "0.5rem" }}>
          <div className="h-5 w-2/5 max-w-[180px] rounded-md bg-[var(--ref-2nd)]" />
          <div className="h-4 w-4/5 max-w-md rounded-md bg-[var(--ref-2nd)]" />
          <div className="h-3.5 w-1/3 max-w-[140px] rounded-md bg-[var(--ref-2nd)]" />
          <div className="mt-4 flex gap-2 border-t border-[var(--ref-line)] pt-4">
            <div className="h-9 w-28 rounded-lg bg-[var(--ref-2nd)]" />
            <div className="h-9 w-9 rounded-lg bg-[var(--ref-2nd)]" />
            <div className="h-9 w-9 rounded-lg bg-[var(--ref-2nd)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
