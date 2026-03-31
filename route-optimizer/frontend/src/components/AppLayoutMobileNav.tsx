import { useId } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PROFILE_PATH, ROUTE_HISTORY_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import "../pages/history/historyRef.css";

function MobileLockedTab({ label }: { label: string }) {
  const tooltipId = useId();
  return (
    <span
      className="hm-ref-mobile-tab-locked"
      tabIndex={0}
      aria-disabled="true"
      aria-describedby={tooltipId}
    >
      {label}
      <svg className="hm-ref-mobile-tab-lock" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
      <span className="hm-ref-locked-tooltip hm-ref-locked-tooltip--mobile" id={tooltipId} role="tooltip">
        Sign in to access
      </span>
    </span>
  );
}

/** Shown below the safe area when the sidebar is hidden (&lt; md). */
export default function AppLayoutMobileNav() {
  const { user } = useAuth();

  return (
    <div className="hm-ref-mobile-tabs app-layout-mobile-nav" aria-label="Navigate">
      <Link to={ROUTE_OPTIMIZER_PATH}>Planner</Link>
      {user ? (
        <>
          <Link to={ROUTE_HISTORY_PATH}>History</Link>
          <Link to={PROFILE_PATH}>Profile</Link>
        </>
      ) : (
        <>
          <MobileLockedTab label="History" />
          <MobileLockedTab label="Profile" />
          <Link to="/">Sign in</Link>
        </>
      )}
    </div>
  );
}
