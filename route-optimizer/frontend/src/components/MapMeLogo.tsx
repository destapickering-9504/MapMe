/** Served from `public/mapme/` (Vite). */
export const MAPME_LOGO_LIGHT = "/mapme/logo-light.png";
export const MAPME_LOGO_DARK = "/mapme/logo-dark.png";

type ThemedProps = {
  className?: string;
  imgClassName?: string;
};

/**
 * Full wordmark; switches asset by `:root[data-theme="dark"]` so it works without React theme state.
 */
export function MapMeLogoThemed({ className, imgClassName }: ThemedProps) {
  const wrap = className ? `mapme-logo-themed ${className}` : "mapme-logo-themed";
  const imgExtra = imgClassName?.trim() ?? "";
  return (
    <div className={wrap} role="img" aria-label="MapMe">
      <img
        src={MAPME_LOGO_LIGHT}
        alt=""
        className={["mapme-logo-themed__light", imgExtra].filter(Boolean).join(" ")}
      />
      <img
        src={MAPME_LOGO_DARK}
        alt=""
        className={["mapme-logo-themed__dark", imgExtra].filter(Boolean).join(" ")}
      />
    </div>
  );
}

type MarkProps = {
  theme: "light" | "dark";
  className?: string;
  alt?: string;
};

/** Single asset for a known theme (e.g. AppHeader). */
export function MapMeLogoMark({ theme, className, alt = "MapMe" }: MarkProps) {
  return (
    <img
      src={theme === "light" ? MAPME_LOGO_LIGHT : MAPME_LOGO_DARK}
      alt={alt}
      className={className}
    />
  );
}
