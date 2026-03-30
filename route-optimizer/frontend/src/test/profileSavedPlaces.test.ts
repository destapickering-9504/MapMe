import { describe, expect, test } from "vitest";
import {
  parseProfileSavedPlaces,
  profilePlaceToOriginQuery,
  profileSavedPlacesUserDataUpdate
} from "../domain/profileSavedPlaces";

describe("profileSavedPlaces", () => {
  test("uses saved_places when key is present (even empty)", () => {
    expect(
      parseProfileSavedPlaces({
        saved_places: [],
        saved_start_locations: [{ id: "a", label: "Home", address: "X", query: "X" }]
      })
    ).toEqual([]);
  });

  test("migrates legacy starts and stops into one deduped list", () => {
    const out = parseProfileSavedPlaces({
      saved_start_locations: [
        { id: "s1", label: "Home", address: "1 A St", query: "1 A St" },
        { id: "s2", label: "Work", address: "2 B Rd", query: "2 B Rd" }
      ],
      saved_locations: [
        { id: "l1", name: "Gym", address: "3 C Ave" },
        { id: "l2", name: "Home", address: "1 A St" }
      ]
    });
    expect(out).toHaveLength(3);
    expect(out.map((p) => p.label).sort()).toEqual(["Gym", "Home", "Work"]);
  });

  test("profilePlaceToOriginQuery prefers address line", () => {
    expect(
      profilePlaceToOriginQuery({
        id: "x",
        label: "Home",
        address: "Oakland, CA",
        query: "legacy"
      })
    ).toBe("Oakland, CA");
  });

  test("profileSavedPlacesUserDataUpdate clears legacy keys", () => {
    const data = profileSavedPlacesUserDataUpdate([
      { id: "1", label: "A", address: "B", query: "B" }
    ]);
    expect(data.saved_places).toEqual([{ id: "1", label: "A", address: "B", query: "B" }]);
    expect(data.saved_start_locations).toEqual([]);
    expect(data.saved_locations).toEqual([]);
  });
});
