import { useEffect, useRef, useState } from "react";

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
  /** Shown in the account menu trigger until auth is wired. */
  displayName?: string;
}

export default function AppHeader({
  theme,
  onThemeChange,
  displayName = "Guest"
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
        <span className="app-header-title">Route Optimizer</span>

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
                <li role="none">
                  <button type="button" className="app-header-dropdown-item" role="menuitem" disabled>
                    Profile
                  </button>
                </li>
                <li role="none">
                  <button type="button" className="app-header-dropdown-item" role="menuitem" disabled>
                    Settings
                  </button>
                </li>
                <li role="none">
                  <button type="button" className="app-header-dropdown-item" role="menuitem" disabled>
                    Sign out
                  </button>
                </li>
                <li className="app-header-dropdown-note" role="presentation">
                  Sign-in coming soon
                </li>
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
