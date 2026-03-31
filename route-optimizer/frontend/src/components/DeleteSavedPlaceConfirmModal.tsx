import { useEffect, useId, useRef } from "react";

interface Props {
  open: boolean;
  placeLabel: string;
  placeAddress: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}

export function DeleteSavedPlaceConfirmModal({
  open,
  placeLabel,
  placeAddress,
  onCancel,
  onConfirm,
  busy = false
}: Props) {
  const titleId = useId();
  const descId = useId();
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

  const addrLine = placeAddress.trim() || "No address on file";

  return (
    <div className="profile-saved-place-delete-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        ref={panelRef}
        className="profile-saved-place-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="profile-saved-place-delete-title">
          Remove saved place?
        </h2>
        <p id={descId} className="profile-saved-place-delete-lead">
          <span className="profile-saved-place-delete-name">{placeLabel}</span>
          <span className="profile-saved-place-delete-addr">{addrLine}</span>
          This place will be removed from your profile. You can add it again later. This cannot be undone.
        </p>
        <div className="profile-saved-place-delete-actions">
          <button type="button" className="auth-flow-secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="profile-saved-place-delete-confirm" disabled={busy} onClick={onConfirm}>
            {busy ? "Removing…" : "Remove place"}
          </button>
        </div>
      </div>
    </div>
  );
}
