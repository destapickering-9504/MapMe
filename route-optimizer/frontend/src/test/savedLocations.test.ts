import { describe, expect, test } from "vitest";
import { parseSavedLocations, toSavedLocationsMetadataPayload, type SavedLocation } from "../domain/savedLocations";

describe("savedLocations", () => {
  test("parses saved_locations", () => {
    const meta = {
      saved_locations: [
        { id: "a", name: "Gym", address: "1 Main St" },
        { id: "b", name: "Dentist", address: "2 Oak Ave" }
      ]
    };
    expect(parseSavedLocations(meta)).toEqual(meta.saved_locations);
  });

  test("falls back to legacy saved_stores when saved_locations absent", () => {
    expect(
      parseSavedLocations({
        saved_stores: [{ id: "x", name: "Target", address: "100 Rd" }]
      })
    ).toEqual([{ id: "x", name: "Target", address: "100 Rd" }]);
  });

  test("prefers saved_locations over saved_stores when both present", () => {
    expect(
      parseSavedLocations({
        saved_locations: [{ id: "n", name: "Only", address: "Here" }],
        saved_stores: [{ id: "old", name: "Old", address: "Gone" }]
      })
    ).toEqual([{ id: "n", name: "Only", address: "Here" }]);
  });

  test("toSavedLocationsMetadataPayload", () => {
    const list: SavedLocation[] = [{ id: "1", name: "A", address: "B" }];
    expect(toSavedLocationsMetadataPayload(list)).toEqual([{ id: "1", name: "A", address: "B" }]);
  });
});
