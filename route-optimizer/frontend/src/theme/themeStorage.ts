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
