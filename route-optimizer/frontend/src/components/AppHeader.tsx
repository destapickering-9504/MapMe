import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapMeLogoMark } from "./MapMeLogo";
import { PROFILE_PATH, ROUTE_HISTORY_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";

export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "route-optimizer-theme";

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const ls = window.localStorage;
    if (!ls || typeof ls.getItem !== "function" || typeof ls.setItem !== "function") {
      return null;
    }
    return ls;
  } catch {
    return null;
  }
}

export function readStoredTheme(): ThemeMode {
  const ls = safeLocalStorage();
  if (!ls) return "light";
  return ls.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function persistTheme(mode: ThemeMode) {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* private mode / quota */
  }
}

interface Props {
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  displayName: string;
  /** Public URL from `user_metadata.avatar_url` (e.g. after profile photo upload). */
  avatarUrl?: string | null;
  authConfigured: boolean;
  isAuthenticated: boolean;
  onSignOut: () => void | Promise<void>;
}

export default function AppHeader({
  theme,
  onThemeChange,
  displayName,
  avatarUrl = null,
  authConfigured,
  isAuthenticated,
  onSignOut
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const toggleTheme = () => {
    onThemeChange(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="app-header" role="banner">
      <div className="app-header-inner">
        <Link
          to={ROUTE_OPTIMIZER_PATH}
          className="app-header-brand-link"
          aria-label="MapMe — Route optimizer"
        >
          <MapMeLogoMark theme={theme} className="app-header-mapme-logo" />
        </Link>

        <div className="app-header-actions">
          <button
            type="button"
            className="app-header-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            aria-pressed={theme === "dark"}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? (
              <span className="app-header-theme-icon" aria-hidden>
                🌙
              </span>
            ) : (
              <span className="app-header-theme-icon" aria-hidden>
                ☀️
              </span>
            )}
          </button>

          {!isAuthenticated ? (
            <Link to="/" className="app-header-sign-in-link">
              Sign in
            </Link>
          ) : (
            <div className="app-header-user" ref={menuRef}>
              <button
                type="button"
                className="app-header-user-trigger"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-controls="account-menu"
                id="account-menu-button"
                onClick={() => setMenuOpen((o) => !o)}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    aria-hidden
                    className="app-header-user-avatar"
                    width={28}
                    height={28}
                  />
                ) : null}
                <span className="app-header-user-name">{displayName}</span>
                <span className="app-header-user-chevron" aria-hidden>
                  ▾
                </span>
              </button>
              {menuOpen ? (
                <ul
                  id="account-menu"
                  className="app-header-dropdown"
                  role="menu"
                  aria-labelledby="account-menu-button"
                >
                  {!authConfigured ? (
                    <li className="app-header-dropdown-note" role="presentation">
                      Add Supabase env vars for full cloud sync.
                    </li>
                  ) : null}
                  <li className="app-header-dropdown-identity" role="presentation">
                    <div className="app-header-dropdown-identity-row">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          aria-hidden
                          className="app-header-dropdown-avatar"
                          width={40}
                          height={40}
                        />
                      ) : null}
                      <div className="app-header-dropdown-identity-text">
                        <span className="app-header-dropdown-identity-label">Signed in as</span>
                        <span className="app-header-dropdown-identity-name">{displayName}</span>
                      </div>
                    </div>
                  </li>
                  <li role="none">
                    <Link
                      to={ROUTE_OPTIMIZER_PATH}
                      className="app-header-dropdown-item app-header-dropdown-link"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Optimize route
                    </Link>
                  </li>
                  <li role="none">
                    <Link
                      to={PROFILE_PATH}
                      className="app-header-dropdown-item app-header-dropdown-link"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </li>
                  <li role="none">
                    <Link
                      to={ROUTE_HISTORY_PATH}
                      className="app-header-dropdown-item app-header-dropdown-link"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      History
                    </Link>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      className="app-header-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        void onSignOut();
                      }}
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
