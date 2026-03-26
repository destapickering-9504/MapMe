import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import App from "../App";

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
      vi.fn().mockImplementation((input: RequestInfo) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/nearby")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              origin_query: "94102",
              origin_address: "San Francisco, CA",
              origin_lat: 37.77,
              origin_lng: -122.42,
              search: "Target",
              places: [
                { name: "Target A", address: "1 St", lat: 37.78, lng: -122.41, distance_m: 400 },
                { name: "Target B", address: "2 St", lat: 37.76, lng: -122.43, distance_m: 900 }
              ]
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => optimizePayload
        });
      })
    );
  });

  test("renders heading", () => {
    render(<App />);
    expect(screen.getByText("Route Optimizer")).toBeTruthy();
  });

  test("runs optimization and renders result", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: /Plan your Route/i }));
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "94102" }
    });
    fireEvent.click(screen.getAllByText("Optimize Route")[0]);
    await waitFor(() => expect(screen.getByText("Pick a route")).toBeTruthy());
  });

  test("find nearby shows legend with place names", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("nearby-origin-input"), {
      target: { value: "94102" }
    });
    fireEvent.change(screen.getByLabelText("nearby-search-input"), {
      target: { value: "Target" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Find nearby stores/i }));
    const legend = await screen.findByRole("list", { name: /nearby results/i });
    expect(legend).toBeTruthy();
    expect(legend.textContent).toContain("Target A");
    expect(legend.textContent).toContain("Target B");
  });
});
