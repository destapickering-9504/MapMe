import { describe, expect, test } from "vitest";
import { chainHaversineMiles, haversineMiles } from "../lib/haversineRouteMiles";

describe("haversineMiles", () => {
  test("same point is ~0 miles", () => {
    expect(haversineMiles(40.7, -74, 40.7, -74)).toBeLessThan(0.001);
  });

  test("known separation is in a sensible range", () => {
    const d = haversineMiles(37.77, -122.42, 34.05, -118.24);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(400);
  });
});

describe("chainHaversineMiles", () => {
  test("returns 0 for fewer than two points", () => {
    expect(chainHaversineMiles([])).toBe(0);
    expect(chainHaversineMiles([{ lat: 1, lng: 2 }])).toBe(0);
  });

  test("sums consecutive segments", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 1 };
    const c = { lat: 0, lng: 2 };
    const one = haversineMiles(a.lat, a.lng, b.lat, b.lng);
    const two = haversineMiles(b.lat, b.lng, c.lat, c.lng);
    expect(chainHaversineMiles([a, b, c])).toBeCloseTo(one + two, 10);
  });
});
