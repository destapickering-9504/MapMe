import { describe, expect, test, vi } from "vitest";
import { fetchAddressSuggestions } from "../api/addressSuggestClient";

describe("fetchAddressSuggestions", () => {
  test("returns empty for short query without fetch", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const out = await fetchAddressSuggestions("ab");
    expect(out).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("returns suggestions from API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [{ label: "1 Main St", lat: 1, lng: 2 }]
        })
      })
    );
    const out = await fetchAddressSuggestions("1 main");
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe("1 Main St");
  });

  test("returns empty on error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false
      })
    );
    expect(await fetchAddressSuggestions("123 main")).toEqual([]);
  });
});
