import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import AppLayout from "../AppLayout";
import RouteOptimizerPage from "../pages/RouteOptimizerPage";
import { ROUTE_OPTIMIZER_PATH } from "../routes/paths";

describe("App", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    const optimizePayload = {
      trip_mode: "round_trip",
      origin_query: "94102",
      origin_address: "94102, San Francisco, CA, USA",
      origin_lat: 37.77,
      origin_lng: -122.42,
      stops_resolved: [
        { query: "Target", address: "Target, 1 St, SF", lat: 37.78, lng: -122.41 },
        { query: "Whole Foods", address: "Whole Foods, 2 St, SF", lat: 37.76, lng: -122.43 }
      ],
      permutations_considered: 2,
      best_route: {
        ordered_stores: ["Target", "Whole Foods"],
        ordered_stops: [
          { query: "Target", address: "Target, 1 St, SF", lat: 37.78, lng: -122.41 },
          { query: "Whole Foods", address: "Whole Foods, 2 St, SF", lat: 37.76, lng: -122.43 }
        ],
        total_minutes: 22
      },
      alternatives: [],
      explanation: "best route",
      travel_time_note: "Drive times use free-flow speeds, not live traffic.",
      best_route_geojson: {
        type: "LineString",
        coordinates: [
          [-122.42, 37.77],
          [-122.41, 37.78],
          [-122.43, 37.76],
          [-122.42, 37.77]
        ]
      },
      route_geojson_options: [
        {
          type: "LineString",
          coordinates: [
            [-122.42, 37.77],
            [-122.41, 37.78],
            [-122.43, 37.76],
            [-122.42, 37.77]
          ]
        }
      ]
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => optimizePayload
        })
      )
    );
  });

  function renderApp() {
    return render(
      <MemoryRouter initialEntries={[ROUTE_OPTIMIZER_PATH]}>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path={ROUTE_OPTIMIZER_PATH} element={<RouteOptimizerPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  test("renders planner heading", () => {
    renderApp();
    expect(screen.getByRole("heading", { name: /Plan your route/i })).toBeTruthy();
  });

  test("runs optimization and renders result", async () => {
    renderApp();
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "94102" }
    });
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Target" }
    });
    fireEvent.change(screen.getByLabelText("Stop 2 store or place name"), {
      target: { value: "Whole Foods" }
    });
    fireEvent.click(screen.getAllByText("Optimize Route")[0]);
    await waitFor(() => expect(screen.getByLabelText("Route summary")).toBeTruthy());
  });
});
