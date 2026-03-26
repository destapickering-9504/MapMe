import { useEffect, useState } from "react";
import "./App.css";
import NearbyExplorer from "./components/NearbyExplorer";
import RouteMap from "./components/RouteMap";
import RouteResultsPanel from "./components/RouteResultsPanel";
import StoreInputForm from "./components/StoreInputForm";
import type { NearbyRequest, OptimizeRequest } from "./domain/routeTypes";
import { useNearbyStores } from "./hooks/useNearbyStores";
import { useOptimizeRoute } from "./hooks/useOptimizeRoute";

type SidebarTab = "plan" | "nearby";

export default function App() {
  const { result, loading, error, run, clear: clearOptimize } = useOptimizeRoute();
  const nearby = useNearbyStores();
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<SidebarTab>("nearby");

  useEffect(() => {
    setSelectedRouteIndex(0);
  }, [result]);

  const handleOptimize = (payload: OptimizeRequest) => {
    nearby.clear();
    run(payload);
  };

  const handleNearbySearch = (payload: NearbyRequest) => {
    clearOptimize();
    nearby.run(payload);
  };

  return (
    <main className="app-shell">
      <aside className="left-panel">
        <section className="brand-card">
          <h1>Route Optimizer</h1>
          <p>Explore stores, optimize the best route, and cut travel time.</p>
        </section>

        <div className="sidebar-tabs" role="tablist" aria-label="Sidebar views">
          <button
            type="button"
            role="tab"
            id="tab-nearby"
            aria-selected={activeTab === "nearby"}
            aria-controls="panel-nearby"
            tabIndex={activeTab === "nearby" ? 0 : -1}
            className={`sidebar-tab ${activeTab === "nearby" ? "sidebar-tab-active" : ""}`}
            onClick={() => setActiveTab("nearby")}
          >
            Stores Near Me
          </button>
          <button
            type="button"
            role="tab"
            id="tab-plan"
            aria-selected={activeTab === "plan"}
            aria-controls="panel-plan"
            tabIndex={activeTab === "plan" ? 0 : -1}
            className={`sidebar-tab ${activeTab === "plan" ? "sidebar-tab-active" : ""}`}
            onClick={() => setActiveTab("plan")}
          >
            Plan your Route
          </button>
        </div>

        <div
          id="panel-plan"
          role="tabpanel"
          aria-labelledby="tab-plan"
          className={activeTab === "plan" ? "tab-panel" : "tab-panel tab-panel-hidden"}
        >
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

        <div
          id="panel-nearby"
          role="tabpanel"
          aria-labelledby="tab-nearby"
          className={activeTab === "nearby" ? "tab-panel" : "tab-panel tab-panel-hidden"}
        >
          <NearbyExplorer
            onSearch={handleNearbySearch}
            loading={nearby.loading}
            error={nearby.error}
            data={nearby.data}
          />
        </div>
      </aside>

      <RouteMap result={result} nearby={nearby.data} selectedRouteIndex={selectedRouteIndex} />
    </main>
  );
}
