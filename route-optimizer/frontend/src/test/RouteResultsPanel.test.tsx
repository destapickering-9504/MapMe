import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import RouteResultsPanel from "../components/RouteResultsPanel";

const stop = (query: string, address: string) => ({
  query,
  address,
  lat: 1,
  lng: 2
});

describe("RouteResultsPanel", () => {
  test("renders origin, resolved stops, best order, and alternatives", () => {
    const onSelect = () => {};
    render(
      <RouteResultsPanel
        selectedRouteIndex={0}
        onSelectRoute={onSelect}
        result={{
          trip_mode: "round_trip",
          origin_query: "30030",
          origin_address: "Decatur, GA, USA",
          origin_lat: 33.77,
          origin_lng: -84.3,
          stops_resolved: [stop("Target", "Target, 100 Main St"), stop("Whole Foods", "Whole Foods, 200 Oak Rd")],
          permutations_considered: 2,
          best_route: {
            ordered_stores: ["Target", "Whole Foods"],
            ordered_stops: [stop("Target", "Target, 100 Main St"), stop("Whole Foods", "Whole Foods, 200 Oak Rd")],
            total_minutes: 25
          },
          alternatives: [
            {
              ordered_stores: ["Whole Foods", "Target"],
              ordered_stops: [stop("Whole Foods", "Whole Foods, 200 Oak Rd"), stop("Target", "Target, 100 Main St")],
              total_minutes: 27
            }
          ],
          explanation: "Evaluated all orders.",
          travel_time_note: "No live traffic in estimates.",
          best_route_geojson: null
        }}
      />
    );
    expect(screen.getByText("30030")).toBeTruthy();
    expect(screen.getByText("Decatur, GA, USA")).toBeTruthy();
    expect(screen.getByText(/store locations/i)).toBeTruthy();
    expect(screen.getByText("About drive times")).toBeTruthy();
    expect(screen.getByText("Pick a route")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Route 1 suggested fastest/i })).toBeTruthy();
    expect(screen.getAllByText("Target, 100 Main St").length).toBe(2);
    expect(screen.getByText(/27\.0 min driving/)).toBeTruthy();
  });

  test("shows end location when destination is present", () => {
    render(
      <RouteResultsPanel
        selectedRouteIndex={0}
        onSelectRoute={() => {}}
        result={{
          trip_mode: "one_way",
          origin_query: "Seattle",
          origin_address: "Seattle, WA, USA",
          origin_lat: 47.6,
          origin_lng: -122.33,
          stops_resolved: [stop("Whole Foods", "Whole Foods, 2001 15th Ave W")],
          permutations_considered: 1,
          best_route: {
            ordered_stores: ["Whole Foods"],
            ordered_stops: [stop("Whole Foods", "Whole Foods, 2001 15th Ave W")],
            total_minutes: 12
          },
          alternatives: [],
          explanation: "ok",
          travel_time_note: "No live traffic.",
          best_route_geojson: null,
          destination_query: "Bellevue, WA",
          destination_address: "Bellevue, WA, USA",
          destination_lat: 47.61,
          destination_lng: -122.2
        }}
      />
    );
    expect(screen.getByText("End location")).toBeTruthy();
    expect(screen.getByText("Bellevue, WA")).toBeTruthy();
    expect(screen.getByText(/from start through all stops to your end location/)).toBeTruthy();
  });
});
