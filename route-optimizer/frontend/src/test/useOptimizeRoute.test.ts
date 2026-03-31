import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { OptimizeResponse } from "../domain/routeTypes";
import { useOptimizeRoute } from "../hooks/useOptimizeRoute";

const optimizeRoute = vi.fn();

vi.mock("../api/optimizeClient", () => ({
  optimizeRoute: (...args: unknown[]) => optimizeRoute(...args)
}));

const minimalResponse: OptimizeResponse = {
  trip_mode: "round_trip",
  origin_query: "94102",
  origin_address: "SF",
  origin_lat: 1,
  origin_lng: 2,
  stops_resolved: [],
  permutations_considered: 1,
  best_route: {
    ordered_stores: ["A"],
    ordered_stops: [{ query: "A", address: "a", lat: 1, lng: 2 }],
    total_minutes: 5
  },
  alternatives: [],
  explanation: "",
  travel_time_note: "",
  best_route_geojson: null
};

describe("useOptimizeRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("applySavedResult stores response and clears error", () => {
    const { result } = renderHook(() => useOptimizeRoute());
    act(() => {
      result.current.applySavedResult(minimalResponse);
    });
    expect(result.current.result).toEqual(minimalResponse);
    expect(result.current.error).toBeNull();
  });

  test("run sets error on non-Error throw", async () => {
    optimizeRoute.mockRejectedValueOnce("weird");
    const { result } = renderHook(() => useOptimizeRoute());
    await act(async () => {
      await result.current.run({
        origin_place: "94102",
        stores: ["A", "B"],
        trip_mode: "round_trip"
      });
    });
    expect(result.current.error).toBe("Unknown error");
  });

  test("run succeeds", async () => {
    optimizeRoute.mockResolvedValueOnce(minimalResponse);
    const { result } = renderHook(() => useOptimizeRoute());
    act(() => {
      void result.current.run({
        origin_place: "94102",
        stores: ["A", "B"],
        trip_mode: "round_trip"
      });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.result).toEqual(minimalResponse);
    expect(result.current.error).toBeNull();
  });

  test("onOptimized runs after successful run only", async () => {
    const onOptimized = vi.fn();
    optimizeRoute.mockResolvedValueOnce(minimalResponse);
    const { result } = renderHook(() => useOptimizeRoute({ onOptimized }));
    await act(async () => {
      await result.current.run({
        origin_place: "94102",
        stores: ["A", "B"],
        trip_mode: "round_trip"
      });
    });
    expect(onOptimized).toHaveBeenCalledTimes(1);
    expect(onOptimized).toHaveBeenCalledWith(minimalResponse);
    act(() => {
      result.current.applySavedResult(minimalResponse);
    });
    expect(onOptimized).toHaveBeenCalledTimes(1);
  });

  test("clear resets result and error", async () => {
    optimizeRoute.mockResolvedValueOnce(minimalResponse);
    const { result } = renderHook(() => useOptimizeRoute());
    await act(async () => {
      await result.current.run({
        origin_place: "94102",
        stores: ["A", "B"],
        trip_mode: "round_trip"
      });
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
