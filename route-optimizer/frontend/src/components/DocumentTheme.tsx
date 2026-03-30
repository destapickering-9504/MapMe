import { useLayoutEffect } from "react";
import { readStoredTheme } from "./AppHeader";

/** Applies stored light/dark preference when routes without App (e.g. auth) mount. */
export default function DocumentTheme() {
  useLayoutEffect(() => {
    const theme = readStoredTheme();
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0f1623" : "#FEA993");
    }
  }, []);
  return null;
}
