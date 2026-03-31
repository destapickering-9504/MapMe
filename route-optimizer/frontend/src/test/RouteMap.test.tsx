import type { ReactElement } from "react";
import { useLayoutEffect } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import RouteMap from "../components/RouteMap";
import type { OptimizeResponse } from "../domain/routeTypes";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";

function ForceDarkTheme() {
  const { setTheme } = useTheme();
  useLayoutEffect(() => {
    setTheme("dark");
  }, [setTheme]);
  return null;
}

const baseResult: OptimizeResponse = {
  trip_mode: "round_trip",
  origin_query: "94102",
  origin_address: "San Francisco, CA",
  origin_lat: 37.77,
  origin_lng: -122.42,
  stops_resolved: [],
  permutations_considered: 1,
  best_route: {
    ordered_stores: ["A"],
    ordered_stops: [{ query: "A", address: "Addr", lat: 37.78, lng: -122.41 }],
    total_minutes: 10
  },
  alternatives: [],
  explanation: "ok",
  travel_time_note: "Drive times are estimates without live traffic.",
  best_route_geojson: null
};

function renderMap(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("RouteMap", () => {
  afterEach(() => cleanup());

  test("shows placeholder when there is no result", () => {
    renderMap(<RouteMap result={null} selectedRouteIndex={0} />);
    expect(screen.getByText(/Optimize a route to see the map/)).toBeTruthy();
  });

  test("renders map container when result is present", () => {
    renderMap(<RouteMap result={baseResult} selectedRouteIndex={0} />);
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });

  test("renders map when result has a fixed destination", () => {
    const withDest: OptimizeResponse = {
      ...baseResult,
      destination_query: "Bellevue, WA",
      destination_address: "Bellevue, Washington, USA",
      destination_lat: 47.61,
      destination_lng: -122.2,
      trip_mode: "one_way"
    };
    renderMap(<RouteMap result={withDest} selectedRouteIndex={0} />);
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });

  test("renders embedded map in dark theme (planner styling path)", () => {
    render(
      <ThemeProvider>
        <ForceDarkTheme />
        <RouteMap result={baseResult} selectedRouteIndex={0} embedded />
      </ThemeProvider>
    );
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });
});
