/** @type {import('tailwindcss').Config} */
export default {
  important: ".hm-history-root",
  /** Match Map Me `document.documentElement.dataset.theme` (not prefers-color-scheme). */
  darkMode: ["selector", '[data-theme="dark"]'],
  corePlugins: {
    preflight: false
  },
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-ui)", "system-ui", "sans-serif"]
      },
      colors: {
        hm: {
          page: "var(--theme-bg-page)",
          card: "var(--theme-bg-card)",
          panel: "var(--theme-bg-panel)",
          border: "var(--theme-border)",
          "border-soft": "var(--theme-border-soft)",
          text: "var(--theme-text)",
          muted: "var(--theme-text-muted)",
          sub: "var(--theme-text-sub)",
          sage: "var(--theme-mint)",
          "sage-deep": "var(--theme-mint-deep)",
          salmon: "var(--theme-salmon)",
          "salmon-deep": "var(--theme-salmon-deep)",
          danger: "var(--theme-danger)",
          ink: "var(--theme-salmon-ink)"
        }
      },
      boxShadow: {
        "hm-soft": "var(--theme-shadow-soft)",
        hm: "var(--theme-shadow)"
      },
      borderRadius: {
        hm: "1rem",
        "hm-lg": "1.25rem",
        "hm-xl": "1.5rem"
      }
    }
  },
  plugins: []
};
