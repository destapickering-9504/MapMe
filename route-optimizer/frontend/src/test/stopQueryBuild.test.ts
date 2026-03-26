import { describe, expect, test } from "vitest";
import { buildStopSearchQuery, placeLabelDuplicatesName } from "../domain/stopQueryBuild";

describe("placeLabelDuplicatesName", () => {
  test("matches with leading The", () => {
    expect(placeLabelDuplicatesName("The Cheesecake Factory", "Cheesecake Factory")).toBe(true);
  });

  test("matches extended brand name in label", () => {
    expect(placeLabelDuplicatesName("Whole Foods Market", "Whole Foods")).toBe(true);
  });

  test("does not match unrelated POI", () => {
    expect(placeLabelDuplicatesName("Holman Road Petco", "Petco")).toBe(false);
  });
});

describe("buildStopSearchQuery", () => {
  test("strips duplicate POI from autocomplete address", () => {
    const q = buildStopSearchQuery(
      "Cheesecake Factory",
      "The Cheesecake Factory, Alderwood Mall Parkway, Lynnwood, WA, USA"
    );
    expect(q).toBe("Cheesecake Factory, Alderwood Mall Parkway, Lynnwood, WA, USA");
  });

  test("strips chained duplicate POI segments", () => {
    const q = buildStopSearchQuery(
      "Cheesecake Factory",
      "Cheesecake Factory, The Cheesecake Factory, Alderwood Mall Parkway, Lynnwood, WA"
    );
    expect(q).toBe("Cheesecake Factory, Alderwood Mall Parkway, Lynnwood, WA");
  });

  test("leaves plain street-only address unchanged", () => {
    expect(buildStopSearchQuery("Petco", "2001 15th Ave W")).toBe("Petco, 2001 15th Ave W");
  });

  test("when whole address is only the duplicated name, returns name", () => {
    expect(buildStopSearchQuery("Target", "Target")).toBe("Target");
    expect(buildStopSearchQuery("Target", "The Target")).toBe("Target");
  });
});
