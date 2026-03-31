import { useEffect, useId, useRef } from "react";

interface Props {
  open: boolean;
  routeTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}

export function DeleteRouteConfirmModal({ open, routeTitle, onCancel, onConfirm, busy = false }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="hm-ref-modal-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        ref={panelRef}
        className="hm-ref-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-desc`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="hm-ref-modal-title">
          Delete this route?
        </h2>
        <p id={`${titleId}-desc`} className="hm-ref-modal-lead">
          <span className="hm-ref-modal-route-name">{routeTitle}</span> will be removed from your history. This cannot be
          undone.
        </p>
        <div className="hm-ref-modal-actions">
          <button type="button" className="hm-ref-btn-2" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="hm-ref-btn-delete-confirm" disabled={busy} onClick={onConfirm}>
            {busy ? "Deleting…" : "Delete route"}
          </button>
        </div>
      </div>
    </div>
  );
}
