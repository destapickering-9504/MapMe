import { useCallback, useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import "./feedback-page.css";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const titleId = useId();
  const descId = useId();

  const dismissOrPlanner = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissOrPlanner();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissOrPlanner]);

  return (
    <main className="feedback-page app-page" aria-labelledby={titleId}>
      <div className="feedback-modal-root" role="presentation">
        <button
          type="button"
          className="feedback-modal-backdrop"
          aria-label="Close feedback dialog"
          onClick={dismissOrPlanner}
        />
        <div
          className="feedback-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <h2 id={titleId} className="feedback-modal__title">
            Coming soon
          </h2>
          <p id={descId} className="feedback-modal__body">
            In-app feedback isn’t available yet—we’re on it.
          </p>
          <div className="feedback-modal__actions">
            <button type="button" className="feedback-modal__btn" onClick={dismissOrPlanner}>
              OK
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
