import { describe, expect, test } from "vitest";
import { plannerStopCommonLabel } from "../lib/plannerStopLabel";

function stop(query: string, address: string) {
  return { query, address, lat: 0, lng: 0 };
}

describe("plannerStopCommonLabel", () => {
  test("uses short name before comma for store-style query", () => {
    expect(plannerStopCommonLabel(stop("Target, Market St", "Target, 1 Market, SF"))).toBe("Target");
  });

  test("uses full address for leading street number", () => {
    expect(plannerStopCommonLabel(stop("123 Main St, SF, CA", "123 Main St, San Francisco, CA"))).toBe(
      "123 Main St, San Francisco, CA"
    );
  });

  test("uses place name before comma even when query is long (composite geocode string)", () => {
    const q =
      "Sephora, 2020, Westlake Avenue, Central Business District, Belltown, Seattle, King County, Washington, 98121, United States";
    const addr =
      "Sephora, 2020 Westlake Avenue, Seattle, King County, Washington, 98121, United States";
    expect(plannerStopCommonLabel(stop(q, addr))).toBe("Sephora");
  });
});
