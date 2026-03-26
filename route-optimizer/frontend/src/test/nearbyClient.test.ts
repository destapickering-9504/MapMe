import { describe, expect, test, vi } from "vitest";
import { fetchNearbyStores } from "../api/nearbyClient";

describe("fetchNearbyStores", () => {
  test("returns parsed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          origin_query: "94102",
          origin_address: "SF",
          origin_lat: 37.77,
          origin_lng: -122.42,
          search: "Target",
          places: []
        })
      })
    );

    const result = await fetchNearbyStores({ origin_place: "94102", search: "Target" });
    expect(result.search).toBe("Target");
    expect(result.places).toEqual([]);
  });

  test("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false
      })
    );
    await expect(fetchNearbyStores({ origin_place: "x", search: "y" })).rejects.toThrow(
      "Failed to search nearby."
    );
  });

  test("uses API error detail when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Local mode does not support nearby search." })
      })
    );
    await expect(fetchNearbyStores({ origin_place: "x", search: "y" })).rejects.toThrow(
      "Local mode does not support nearby search."
    );
  });
});
