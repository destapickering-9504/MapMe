import { Link } from "react-router-dom";
import { FEEDBACK_PATH, HELP_PATH, PRIVACY_PATH } from "../routes/paths";

export default function AppFooter() {
  const year = new Date().getFullYear();

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
        <Link to={HELP_PATH} className="app-global-footer__link">
          Help
        </Link>
        <span className="app-global-footer__sep" aria-hidden>
          •
        </span>
        <Link to={PRIVACY_PATH} className="app-global-footer__link">
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
