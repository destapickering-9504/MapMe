import { describe, expect, test, vi } from "vitest";
import { optimizeRoute } from "../api/optimizeClient";

describe("optimizeRoute", () => {
  test("returns parsed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          best_route: { ordered_stores: ["A"], total_minutes: 10 },
          alternatives: [],
          explanation: "ok"
        })
      })
    );

    const result = await optimizeRoute({
      origin_place: "10001",
      stores: ["A", "B"],
      trip_mode: "round_trip"
    });
    expect(result.best_route.total_minutes).toBe(10);
  });

  test("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false
      })
    );
    await expect(
      optimizeRoute({
        origin_place: "10001",
        stores: ["A", "B"],
        trip_mode: "round_trip"
      })
    ).rejects.toThrow("Failed to optimize route.");
  });

  test("uses API error detail when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Could not find that location." })
      })
    );
    await expect(
      optimizeRoute({
        origin_place: "x",
        stores: ["A", "B"],
        trip_mode: "round_trip"
      })
    ).rejects.toThrow("Could not find that location.");
  });
});
