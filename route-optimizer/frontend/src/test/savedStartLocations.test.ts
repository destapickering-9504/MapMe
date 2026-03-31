import { describe, expect, test } from "vitest";
import {
  computeStartLocationQuery,
  parseSavedStartLocations,
  toMetadataPayload,
  type SavedStartLocation
} from "../domain/savedStartLocations";

describe("savedStartLocations", () => {
  test("computeStartLocationQuery uses address only when address is set", () => {
    expect(computeStartLocationQuery("Home", "98107")).toBe("98107");
    expect(computeStartLocationQuery("Home", "5621 22nd Ave NW, Seattle, WA")).toBe(
      "5621 22nd Ave NW, Seattle, WA"
    );
  });

  test("computeStartLocationQuery falls back to label when no address", () => {
    expect(computeStartLocationQuery("Home", "")).toBe("Home");
  });

  test("parses saved_start_locations array and normalizes query from address", () => {
    const meta = {
      saved_start_locations: [
        { id: "a", label: "Home", address: "94102", query: "Home, 94102" },
        { id: "b", label: "Work", address: "1 Market St, SF", query: "Work, 1 Market St, SF" }
      ]
    };
    expect(parseSavedStartLocations(meta)).toEqual([
      { id: "a", label: "Home", address: "94102", query: "94102" },
      { id: "b", label: "Work", address: "1 Market St, SF", query: "1 Market St, SF" }
    ]);
  });

  test("fills query from address when query missing", () => {
    const meta = {
      saved_start_locations: [{ id: "a", label: "Home", address: "94102 Oakland" }]
    };
    const out = parseSavedStartLocations(meta);
    expect(out).toEqual([{ id: "a", label: "Home", address: "94102 Oakland", query: "94102 Oakland" }]);
  });

  test("migrates legacy start_location when no array", () => {
    expect(parseSavedStartLocations({ start_location: "  Oakland  " })).toEqual([
      { id: "migrated", label: "Home", address: "", query: "Oakland" }
    ]);
  });

  test("prefers array over legacy", () => {
    const meta = {
      start_location: "legacy",
      saved_start_locations: [{ id: "x", label: "A", address: "", query: "b" }]
    };
    expect(parseSavedStartLocations(meta)).toEqual([{ id: "x", label: "A", address: "", query: "b" }]);
  });

  test("empty saved_start_locations does not fall back to legacy", () => {
    expect(parseSavedStartLocations({ start_location: "legacy", saved_start_locations: [] })).toEqual([]);
  });

  test("toMetadataPayload roundtrips", () => {
    const list: SavedStartLocation[] = [{ id: "1", label: "H", address: "Main St", query: "Main St" }];
    expect(toMetadataPayload(list)).toEqual([{ id: "1", label: "H", address: "Main St", query: "Main St" }]);
  });
});
