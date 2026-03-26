import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import type { NearbyResponse, OptimizeResponse } from "../domain/routeTypes";
import RouteMap from "../components/RouteMap";

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
  best_route_geojson: null
};

describe("RouteMap", () => {
  afterEach(() => cleanup());

  test("shows placeholder when there is no result and no nearby data", () => {
    render(<RouteMap result={null} nearby={null} selectedRouteIndex={0} />);
    expect(screen.getByText(/Plan your Route/)).toBeTruthy();
  });

  test("renders map container when result is present", () => {
    render(<RouteMap result={baseResult} nearby={null} selectedRouteIndex={0} />);
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
    render(<RouteMap result={withDest} nearby={null} selectedRouteIndex={0} />);
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });

  test("renders map container when only nearby data is present", () => {
    const nearby: NearbyResponse = {
      origin_query: "94102",
      origin_address: "San Francisco, CA",
      origin_lat: 37.77,
      origin_lng: -122.42,
      search: "Target",
      places: [{ name: "Target", address: "1 Main St", lat: 37.78, lng: -122.41, distance_m: 500 }]
    };
    render(<RouteMap result={null} nearby={nearby} selectedRouteIndex={0} />);
    expect(screen.getByTestId("map-container")).toBeTruthy();
  });
});
