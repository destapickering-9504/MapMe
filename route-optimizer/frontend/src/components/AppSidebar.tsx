import { useId, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { MapMeLogoThemed } from "./MapMeLogo";
import { PROFILE_PATH, ROUTE_HISTORY_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import { useTheme } from "../theme/ThemeContext";
import "../pages/history/historyRef.css";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "hm-ref-sidebar-link hm-ref-sidebar-link--active" : "hm-ref-sidebar-link";

function SidebarLockedNavItem({ label }: { label: string }) {
  const tooltipId = useId();
  return (
    <span
      className="hm-ref-sidebar-link hm-ref-sidebar-link--locked"
      tabIndex={0}
      aria-disabled="true"
      aria-describedby={tooltipId}
    >
      <svg className="hm-ref-sidebar-icon hm-ref-sidebar-lock-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
      {label}
      <span className="hm-ref-locked-tooltip" id={tooltipId} role="tooltip">
        Sign in to access
      </span>
    </span>
  );
}

export default function AppSidebar() {
  const navigate = useNavigate();
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const themeLabelId = useId();
  const isDark = theme === "dark";

  const displayName = useMemo(() => {
    if (!user) return "";
    if (authLoading && configured) return "…";
    const meta = user.user_metadata;
    const fromProfile = typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
    if (fromProfile) return fromProfile;
    const fromEmail = user.email?.split("@")[0];
    return fromEmail && fromEmail.length > 0 ? fromEmail : "Account";
  }, [authLoading, configured, user]);

  const avatarUrl = useMemo(() => {
    if (!user) return null;
    const v = user.user_metadata?.avatar_url;
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <aside className="hm-ref-sidebar app-sidebar" aria-label="App navigation">
      <Link to={ROUTE_OPTIMIZER_PATH} className="hm-ref-sidebar-brand">
        <MapMeLogoThemed className="hm-ref-sidebar-wordmark" />
      </Link>

      <nav className="hm-ref-sidebar-nav app-sidebar-nav" aria-label="Primary">
        <NavLink to={ROUTE_OPTIMIZER_PATH} className={navLinkClass} end={false}>
          {user ? (
            <svg className="hm-ref-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6.75H7.5a2.25 2.25 0 0 0-2.25 2.25v11.25A2.25 2.25 0 0 0 7.5 22.5h9a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3 3m0 0-3-3m3 3V15"
              />
            </svg>
          ) : (
            <span className="hm-ref-sidebar-planner-dot" aria-hidden />
          )}
          Planner
        </NavLink>
        {user ? (
          <>
            <NavLink to={ROUTE_HISTORY_PATH} className={navLinkClass}>
              <svg className="hm-ref-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              History
            </NavLink>
            <NavLink to={PROFILE_PATH} className={navLinkClass} end>
              <svg className="hm-ref-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              Profile
            </NavLink>
          </>
        ) : (
          <>
            <SidebarLockedNavItem label="History" />
            <SidebarLockedNavItem label="Profile" />
          </>
        )}
      </nav>

      <div className="app-sidebar-bottom">
        {user ? (
          <>
            <div className="app-sidebar-user">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="app-sidebar-user-avatar" width={36} height={36} />
              ) : (
                <div className="app-sidebar-user-avatar-placeholder" aria-hidden />
              )}
              <div className="app-sidebar-user-text">
                <span className="app-sidebar-user-name">{displayName}</span>
                {!configured ? <span className="app-sidebar-user-note">Add Supabase env for sync</span> : null}
              </div>
            </div>
            <button type="button" className="app-sidebar-sign-out" onClick={() => void handleSignOut()}>
              Sign out
            </button>
          </>
        ) : (
          <div className="app-sidebar-guest-cta">
            <p className="app-sidebar-guest-hint">Save your routes & access history</p>
            <Link to="/" className="app-sidebar-sign-in-btn">
              Sign in <span aria-hidden>→</span>
            </Link>
            <p className="app-sidebar-guest-footnote">Continue as guest</p>
          </div>
        )}

        {!user ? (
          <div className="app-sidebar-appearance">
            <div className="app-sidebar-appearance-leading">
              {isDark ? (
                <svg className="app-sidebar-appearance-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              ) : (
                <svg className="app-sidebar-appearance-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                  />
                </svg>
              )}
              <span className="app-sidebar-appearance-label" id={themeLabelId}>
                {isDark ? "Dark" : "Light"} mode
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-labelledby={themeLabelId}
              className={`profile-theme-switch app-sidebar-theme-switch${isDark ? " profile-theme-switch--on" : ""}`}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              <span className="profile-theme-switch-thumb" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
