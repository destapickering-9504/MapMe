import { describe, expect, test } from "vitest";

import type { OptimizeResponse } from "../domain/routeTypes";
import { buildAppleMapsDirectionsUrl } from "../lib/externalDirections/appleMapsDirectionsUrl";
import { buildExternalNavigationLinks } from "../lib/externalDirections/externalNavigationLinks";
import { planDirectionsLegs } from "../lib/externalDirections/directionsLegPlan";
import {
  buildGoogleMapsDirectionsUrl,
  orderedLatLngPointsForExternalDirections
} from "../lib/externalDirections/googleMapsDirectionsUrl";
import { buildWazeNavigateUrl } from "../lib/externalDirections/wazeDirectionsUrl";

function minimalResult(overrides: Partial<OptimizeResponse> = {}): OptimizeResponse {
  const base: OptimizeResponse = {
    trip_mode: "one_way",
    origin_query: "A",
    origin_address: "A",
    origin_lat: 47.6,
    origin_lng: -122.33,
    stops_resolved: [],
    permutations_considered: 1,
    best_route: {
      ordered_stores: ["B", "C"],
      ordered_stops: [
        { query: "B", address: "B", lat: 47.61, lng: -122.34 },
        { query: "C", address: "C", lat: 47.62, lng: -122.35 }
      ],
      total_minutes: 10
    },
    alternatives: [],
    explanation: "",
    travel_time_note: "",
    best_route_geojson: null
  };
  return { ...base, ...overrides };
}

describe("orderedLatLngPointsForExternalDirections", () => {
  test("one-way: origin then stops in order", () => {
    const r = minimalResult();
    const pts = orderedLatLngPointsForExternalDirections(r, 0);
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual({ lat: 47.6, lng: -122.33 });
    expect(pts[2]).toEqual({ lat: 47.62, lng: -122.35 });
  });

  test("round trip: ends at origin", () => {
    const r = minimalResult({ trip_mode: "round_trip" });
    const pts = orderedLatLngPointsForExternalDirections(r, 0);
    expect(pts).toHaveLength(4);
    expect(pts[0]).toEqual(pts[3]);
  });
});

describe("buildGoogleMapsDirectionsUrl", () => {
  test("driving: two points, no waypoints param", () => {
    const pts = [
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 }
    ];
    const out = buildGoogleMapsDirectionsUrl(pts, "driving");
    expect(out).not.toBeNull();
    expect(out!.truncated).toBe(false);
    const u = new URL(out!.url);
    expect(u.searchParams.get("origin")).toBe("1,2");
    expect(u.searchParams.get("destination")).toBe("3,4");
    expect(u.searchParams.get("travelmode")).toBe("driving");
    expect(u.searchParams.get("waypoints")).toBeNull();
  });

  test("walking: travelmode walking", () => {
    const out = buildGoogleMapsDirectionsUrl(
      [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 }
      ],
      "walking"
    );
    expect(out!.url).toContain("travelmode=walking");
  });

  test("includes waypoints when within limit", () => {
    const pts = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 }
    ];
    const out = buildGoogleMapsDirectionsUrl(pts, "driving");
    expect(out!.truncated).toBe(false);
    expect(out!.url).toContain("waypoints=1%2C1%7C2%2C2");
  });

  test("truncates when more than 9 intermediates", () => {
    const pts: { lat: number; lng: number }[] = [{ lat: 0, lng: 0 }];
    for (let i = 1; i <= 11; i++) {
      pts.push({ lat: i, lng: i });
    }
    expect(pts).toHaveLength(12);
    const out = buildGoogleMapsDirectionsUrl(pts, "driving");
    expect(out!.truncated).toBe(true);
    const u = new URL(out!.url);
    expect(u.searchParams.get("origin")).toBe("0,0");
    expect(u.searchParams.get("destination")).toBe("11,11");
    expect(u.searchParams.get("waypoints")).toBeNull();
  });

  test("returns null for fewer than 2 points", () => {
    expect(buildGoogleMapsDirectionsUrl([{ lat: 0, lng: 0 }], "driving")).toBeNull();
    expect(buildGoogleMapsDirectionsUrl([], "driving")).toBeNull();
  });
});

describe("planDirectionsLegs", () => {
  test("returns null for < 2 points", () => {
    expect(planDirectionsLegs([], 9)).toBeNull();
    expect(planDirectionsLegs([{ lat: 0, lng: 0 }], 9)).toBeNull();
  });
});

describe("buildAppleMapsDirectionsUrl", () => {
  test("saddr, daddr chain, dirflg driving", () => {
    const pts = [
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 }
    ];
    const out = buildAppleMapsDirectionsUrl(pts, "driving");
    expect(out).not.toBeNull();
    const u = new URL(out!.url);
    expect(u.hostname).toBe("maps.apple.com");
    expect(u.searchParams.get("saddr")).toBe("1,2");
    expect(u.searchParams.getAll("daddr")).toEqual(["3,4", "5,6"]);
    expect(u.searchParams.get("dirflg")).toBe("d");
  });

  test("walking uses dirflg w", () => {
    const out = buildAppleMapsDirectionsUrl(
      [
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 }
      ],
      "walking"
    );
    expect(out!.url).toContain("dirflg=w");
  });
});

describe("buildWazeNavigateUrl", () => {
  test("final coordinate and navigate=yes", () => {
    const out = buildWazeNavigateUrl([
      { lat: 1, lng: 2 },
      { lat: 9, lng: 8 }
    ]);
    expect(out!.url).toContain("waze.com");
    expect(out!.url).toContain("ll=9%2C8");
    expect(out!.url).toContain("navigate=yes");
    expect(out!.opensFinalStopOnly).toBe(false);
  });

  test("opensFinalStopOnly when more than two points", () => {
    const out = buildWazeNavigateUrl([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 }
    ]);
    expect(out!.opensFinalStopOnly).toBe(true);
  });
});

describe("buildExternalNavigationLinks", () => {
  test("returns all three providers", () => {
    const pts = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 }
    ];
    const bundle = buildExternalNavigationLinks(pts, "driving");
    expect(bundle).not.toBeNull();
    expect(bundle!.google.url).toContain("google.com/maps");
    expect(bundle!.apple.url).toContain("maps.apple.com");
    expect(bundle!.waze.url).toContain("waze.com");
  });
});
