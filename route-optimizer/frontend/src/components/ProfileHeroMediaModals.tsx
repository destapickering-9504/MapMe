import { useEffect, useId } from "react";

function IconCamera({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 0 1 8.19 5.25h7.62a2.31 2.31 0 0 1 1.363.925l1.105 1.658a.75.75 0 0 0 .624.334H19.5A2.25 2.25 0 0 1 21.75 10.5v6.75A2.25 2.25 0 0 1 19.5 19.5h-15a2.25 2.25 0 0 1-2.25-2.25V10.5A2.25 2.25 0 0 1 4.5 8.25h.191a.75.75 0 0 0 .624-.334l1.105-1.658Z"
      />
      <path
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

type ProfilePhotoModalProps = {
  open: boolean;
  onClose: () => void;
  previewSrc: string | null;
  showPlaceholder: boolean;
  initials: string;
  busy: boolean;
  hasStoredPhoto: boolean;
  onUpdateClick: () => void;
  onRemoveClick: () => void;
};

export function ProfilePhotoModal({
  open,
  onClose,
  previewSrc,
  showPlaceholder,
  initials,
  busy,
  hasStoredPhoto,
  onUpdateClick,
  onRemoveClick
}: ProfilePhotoModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  return (
    <div className="profile-media-modal-root" role="presentation">
      <button
        type="button"
        className="profile-media-modal-backdrop"
        aria-label="Close"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        className="profile-media-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="profile-media-modal-header">
          <h2 id={titleId} className="profile-media-modal-title">
            Profile photo
          </h2>
          <button
            type="button"
            className="profile-media-modal-close"
            onClick={() => {
              if (!busy) onClose();
            }}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="profile-media-modal-body profile-media-modal-body--photo">
          <div className="profile-media-modal-photo-stage">
            {showPlaceholder || !previewSrc ? (
              <div className="profile-media-modal-photo-placeholder" aria-hidden>
                {initials}
              </div>
            ) : (
              <img src={previewSrc} alt="" className="profile-media-modal-photo-img" width={280} height={280} />
            )}
            {busy ? (
              <div className="profile-media-modal-busy" role="status">
                Working…
              </div>
            ) : null}
          </div>
        </div>
        <div className="profile-media-modal-footer">
          <button
            type="button"
            className="profile-media-modal-action"
            disabled={busy}
            onClick={onUpdateClick}
          >
            <IconCamera className="profile-media-modal-action-icon" />
            <span>Update</span>
          </button>
          <button
            type="button"
            className="profile-media-modal-action profile-media-modal-action--danger"
            disabled={busy || !hasStoredPhoto}
            onClick={() => void onRemoveClick()}
            title={!hasStoredPhoto ? "No photo to remove" : undefined}
          >
            <IconTrash className="profile-media-modal-action-icon" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

type ProfileCoverModalProps = {
  open: boolean;
  onClose: () => void;
  /** Shown behind avatar in preview: pending upload, saved URL, or null for default art */
  bannerPreviewUrl: string | null;
  useDefaultBannerArt: boolean;
  avatarSrc: string | null;
  avatarShowPlaceholder: boolean;
  avatarInitials: string;
  busy: boolean;
  hasPendingFile: boolean;
  hasSavedCover: boolean;
  onPickFile: () => void;
  onSave: () => void;
  onReset: () => void;
};

export function ProfileCoverModal({
  open,
  onClose,
  bannerPreviewUrl,
  useDefaultBannerArt,
  avatarSrc,
  avatarShowPlaceholder,
  avatarInitials,
  busy,
  hasPendingFile,
  hasSavedCover,
  onPickFile,
  onSave,
  onReset
}: ProfileCoverModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  if (!open) return null;

  const bannerStyle =
    !useDefaultBannerArt && bannerPreviewUrl
      ? { backgroundImage: `url(${JSON.stringify(bannerPreviewUrl)})` }
      : undefined;

  return (
    <div className="profile-media-modal-root" role="presentation">
      <button
        type="button"
        className="profile-media-modal-backdrop"
        aria-label="Close"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        className="profile-media-modal profile-media-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="profile-media-modal-header">
          <h2 id={titleId} className="profile-media-modal-title">
            Cover photo
          </h2>
          <button
            type="button"
            className="profile-media-modal-close"
            onClick={() => {
              if (!busy) onClose();
            }}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <p className="profile-media-modal-sub">Preview shows how your banner and profile photo look together.</p>
        <div className="profile-media-modal-body profile-media-modal-body--cover">
          <div className="profile-cover-preview-card" aria-hidden>
            <div
              className={
                useDefaultBannerArt
                  ? "profile-cover-preview-banner profile-cover-preview-banner--default"
                  : "profile-cover-preview-banner"
              }
              style={bannerStyle}
            />
            <div className="profile-cover-preview-avatar-wrap">
              {avatarShowPlaceholder || !avatarSrc ? (
                <div className="profile-cover-preview-avatar profile-cover-preview-avatar--ph">{avatarInitials}</div>
              ) : (
                <img src={avatarSrc} alt="" className="profile-cover-preview-avatar" width={72} height={72} />
              )}
            </div>
            <div className="profile-cover-preview-body" />
          </div>
        </div>
        <div className="profile-media-modal-footer profile-media-modal-footer--wrap">
          <button type="button" className="profile-media-modal-action" disabled={busy} onClick={onPickFile}>
            <IconCamera className="profile-media-modal-action-icon" />
            <span>Upload</span>
          </button>
          <button
            type="button"
            className="profile-media-modal-primary"
            disabled={busy || !hasPendingFile}
            onClick={() => void onSave()}
          >
            {busy ? "Saving…" : "Save cover"}
          </button>
          <button
            type="button"
            className="profile-media-modal-action profile-media-modal-action--danger"
            disabled={busy || !hasSavedCover}
            onClick={() => void onReset()}
          >
            <IconTrash className="profile-media-modal-action-icon" />
            <span>Reset to default</span>
          </button>
        </div>
      </div>
    </div>
  );
}
