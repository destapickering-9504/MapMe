import { Link } from "react-router-dom";
import { FEEDBACK_PATH } from "../routes/paths";
import { useHelpModal } from "./HelpModal";
import { usePrivacyModal } from "./PrivacyModal";

export default function AppFooter() {
  const year = new Date().getFullYear();
  const { openHelp } = useHelpModal();
  const { openPrivacy } = usePrivacyModal();

  return (
    <footer className="app-global-footer" role="contentinfo">
      <div className="app-global-footer__brand">
        <span className="app-global-footer__brand-text">MapMe</span>
        <span className="app-global-footer__copy">
          {" "}
          © {year}
        </span>
      </div>

      <nav className="app-global-footer__links" aria-label="Footer">
        <Link to={FEEDBACK_PATH} className="app-global-footer__link">
          Feedback
        </Link>
        <span className="app-global-footer__sep" aria-hidden>
          •
        </span>
        <button type="button" className="app-global-footer__link app-global-footer__link--button" onClick={openHelp}>
          Help
        </button>
        <span className="app-global-footer__sep" aria-hidden>
          •
        </span>
        <button
          type="button"
          className="app-global-footer__link app-global-footer__link--button"
          onClick={openPrivacy}
        >
          Privacy
        </button>
      </nav>
    </footer>
  );
}
