import { useSyncExternalStore } from "react";

/** Served from `public/mapme/` (Vite). */
export const MAPME_LOGO_LIGHT = "/mapme/logo-light.png";
export const MAPME_LOGO_DARK = "/mapme/logo-dark.png";

function subscribeDocumentTheme(onChange: () => void) {
  const el = document.documentElement;
  const obs = new MutationObserver(() => onChange());
  obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

function getDocumentThemeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

type ThemedProps = {
  className?: string;
  imgClassName?: string;
};

/**
 * Full wordmark PNG: `logo-light.png` when `data-theme` is light (or unset), `logo-dark.png` when dark.
 * Follows `document.documentElement.dataset.theme` so it stays correct with ThemeProvider, DocumentTheme, and profile toggle.
 */
export function MapMeLogoThemed({ className, imgClassName }: ThemedProps) {
  const mode = useSyncExternalStore(subscribeDocumentTheme, getDocumentThemeSnapshot, () => "light");
  const wrap = className ? `mapme-logo-themed ${className}` : "mapme-logo-themed";
  const imgExtra = imgClassName?.trim() ?? "";
  const src = mode === "dark" ? MAPME_LOGO_DARK : MAPME_LOGO_LIGHT;
  return (
    <div className={wrap} role="img" aria-label="MapMe">
      <img
        src={src}
        alt=""
        className={["mapme-logo-themed__img", imgExtra].filter(Boolean).join(" ")}
      />
    </div>
  );
}

type MarkProps = {
  theme: "light" | "dark";
  className?: string;
  alt?: string;
};

/** Single asset for a known theme (e.g. static chrome). */
export function MapMeLogoMark({ theme, className, alt = "MapMe" }: MarkProps) {
  return (
    <img
      src={theme === "light" ? MAPME_LOGO_LIGHT : MAPME_LOGO_DARK}
      alt={alt}
      className={className}
    />
  );
}

type PinMarkProps = {
  className?: string;
};

/**
 * Icon-only route/map mark for tight spaces (e.g. sidebar). Uses CSS variables
 * `--ref-sage` and `--ref-cta` when used inside `.hm-history-root.hm-ref`.
 */
export function MapMePinMark({ className }: PinMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="var(--ref-sage, var(--theme-mint-deep))"
        d="M12 21.5c-.35 0-.7-.12-.98-.36C9.35 19.68 4 14.1 4 9a8 8 0 1 1 16 0c0 5.1-5.35 10.68-7.02 12.14-.28.24-.63.36-.98.36Z"
      />
      <circle cx="12" cy="9" r="2.35" fill="var(--ref-cta-text, #fffaf7)" />
    </svg>
  );
}
