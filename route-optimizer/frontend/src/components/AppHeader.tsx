import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapMeLogoMark } from "./MapMeLogo";
import { ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import type { ThemeMode } from "../theme/themeStorage";

interface Props {
  theme: ThemeMode;
  displayName: string;
  /** Public URL from `user_metadata.avatar_url` (e.g. after profile photo upload). */
  avatarUrl?: string | null;
  authConfigured: boolean;
  isAuthenticated: boolean;
  onSignOut: () => void | Promise<void>;
}

export default function AppHeader({
  theme,
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
