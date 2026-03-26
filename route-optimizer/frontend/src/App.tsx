import { useEffect, useLayoutEffect, useState } from "react";
import "./App.css";
import AppHeader, { persistTheme, readStoredTheme, type ThemeMode } from "./components/AppHeader";
import RouteMap from "./components/RouteMap";
import RouteResultsPanel from "./components/RouteResultsPanel";
import StoreInputForm from "./components/StoreInputForm";
import type { OptimizeRequest } from "./domain/routeTypes";
import { useOptimizeRoute } from "./hooks/useOptimizeRoute";

export default function App() {
  const { result, loading, error, run } = useOptimizeRoute();
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme());

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    persistTheme(theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0f1623" : "#FEA993");
    }
  }, [theme]);

  useEffect(() => {
    setSelectedRouteIndex(0);
  }, [result]);

  const handleOptimize = (payload: OptimizeRequest) => {
    run(payload);
  };

  return (
    <div className="app-layout">
      <AppHeader theme={theme} onThemeChange={setTheme} />
      <main className="app-shell">
        <aside className="left-panel">
          <section className="brand-card">
            <p className="brand-eyebrow">For busy days</p>
            <h1>Route Optimizer</h1>
            <p className="brand-tagline">
              Fewer miles, less stress — whether you&apos;re running errands after work or helping family shop.
            </p>
          </section>

          <div className="tab-panel">
            <StoreInputForm onSubmit={handleOptimize} />
            {loading && <p className="status-text">Optimizing...</p>}
            {error && (
              <p className="status-text error-text" role="alert">
                {error}
              </p>
            )}
            <RouteResultsPanel
              result={result}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={setSelectedRouteIndex}
            />
          </div>
        </aside>

        <RouteMap result={result} selectedRouteIndex={selectedRouteIndex} />
      </main>
    </div>
  );
}
