import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import "../pages/help-page.css";
import "../pages/privacy-page.css";

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 118 0v4" strokeLinecap="round" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function IconBan({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M6.34 6.34l11.32 11.32" strokeLinecap="round" />
    </svg>
  );
}

function IconCloud({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.42 9.22a7 7 0 00-13.36 1.9A4.5 4.5 0 006.5 19H17a4 4 0 001.42-7.78z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SUPPORT_MAIL = "support@mapme.app";
const SUPPORT_HREF = `mailto:${SUPPORT_MAIL}?subject=MapMe%20privacy`;

type PrivacyModalContextValue = {
  openPrivacy: () => void;
};

const PrivacyModalContext = createContext<PrivacyModalContextValue | null>(null);

export function usePrivacyModal(): PrivacyModalContextValue {
  const ctx = useContext(PrivacyModalContext);
  if (!ctx) {
    throw new Error("usePrivacyModal must be used within PrivacyModalProvider");
  }
  return ctx;
}

export function PrivacyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="help-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="help-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="privacy-page__card help-modal__card">
          <button type="button" className="help-modal__close" onClick={onClose} aria-label="Close privacy">
            <span aria-hidden>×</span>
          </button>
          <h1 id="privacy-modal-title" className="privacy-page__title">
            Privacy
          </h1>
          <p className="privacy-page__lede">We respect your privacy and keep things simple.</p>

          <hr className="privacy-page__rule" />

          <section className="privacy-page__section" aria-labelledby="privacy-collect-heading">
            <div className="privacy-page__icon" aria-hidden>
              <IconLock />
            </div>
            <div className="privacy-page__section-body">
              <h2 id="privacy-collect-heading" className="privacy-page__section-title">
                What we collect
              </h2>
              <ul className="privacy-page__list">
                <li>Your email (for account access)</li>
                <li>Saved places and routes you create</li>
              </ul>
            </div>
          </section>

          <hr className="privacy-page__rule" />

          <section className="privacy-page__section" aria-labelledby="privacy-use-heading">
            <div className="privacy-page__icon" aria-hidden>
              <IconGear />
            </div>
            <div className="privacy-page__section-body">
              <h2 id="privacy-use-heading" className="privacy-page__section-title">
                How we use it
              </h2>
              <ul className="privacy-page__list">
                <li>To help you plan and save routes</li>
                <li>To improve your experience</li>
              </ul>
            </div>
          </section>

          <hr className="privacy-page__rule" />

          <section className="privacy-page__section" aria-labelledby="privacy-dont-heading">
            <div className="privacy-page__icon privacy-page__icon--warn" aria-hidden>
              <IconBan />
            </div>
            <div className="privacy-page__section-body">
              <h2 id="privacy-dont-heading" className="privacy-page__section-title">
                What we don’t do
              </h2>
              <ul className="privacy-page__list">
                <li>We do not track your real-time location</li>
                <li>We do not sell your data</li>
              </ul>
            </div>
          </section>

          <hr className="privacy-page__rule" />

          <section className="privacy-page__section" aria-labelledby="privacy-storage-heading">
            <div className="privacy-page__icon" aria-hidden>
              <IconCloud />
            </div>
            <div className="privacy-page__section-body">
              <h2 id="privacy-storage-heading" className="privacy-page__section-title">
                Data storage
              </h2>
              <p className="privacy-page__para">
                Your data is securely stored using our backend provider (Supabase).
              </p>
            </div>
          </section>

          <hr className="privacy-page__rule" />

          <section className="privacy-page__section" aria-labelledby="privacy-contact-heading">
            <div className="privacy-page__icon" aria-hidden>
              <IconMail />
            </div>
            <div className="privacy-page__section-body">
              <h2 id="privacy-contact-heading" className="privacy-page__section-title">
                Contact
              </h2>
              <p className="privacy-page__contact">
                Questions? <a href={SUPPORT_HREF}>{SUPPORT_MAIL}</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PrivacyModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPrivacy = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openPrivacy }), [openPrivacy]);

  return (
    <PrivacyModalContext.Provider value={value}>
      {children}
      <PrivacyModal open={open} onClose={() => setOpen(false)} />
    </PrivacyModalContext.Provider>
  );
}
