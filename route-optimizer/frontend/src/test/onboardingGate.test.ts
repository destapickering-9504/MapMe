import type { User } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";
import {
  isOnboardingComplete,
  readOnboardingFromUser,
  sortTravelModes,
  toggleTravelMode
} from "../auth/onboardingGate";

function userWithMeta(meta: Record<string, unknown>): User {
  return { user_metadata: meta } as User;
}

describe("onboardingGate", () => {
  test("sortTravelModes orders known modes and drops unknown", () => {
    expect(sortTravelModes(["transit", "driving", "walking"])).toEqual(["driving", "walking", "transit"]);
    expect(sortTravelModes(new Set(["walking", "bogus"] as Iterable<string>))).toEqual(["walking"]);
  });

  test("toggleTravelMode adds mode and preserves at least one selected", () => {
    expect(toggleTravelMode(["driving"], "walking")).toEqual(["driving", "walking"]);
    expect(toggleTravelMode(["driving", "walking"], "driving")).toEqual(["walking"]);
    expect(toggleTravelMode(["driving"], "driving")).toEqual(["driving"]);
  });

  test("incomplete without name", () => {
    expect(isOnboardingComplete(userWithMeta({ travel_modes: ["driving"] }))).toBe(false);
  });

  test("incomplete when name is only whitespace", () => {
    expect(isOnboardingComplete(userWithMeta({ full_name: "  ", travel_modes: ["driving"] }))).toBe(false);
  });

  test("incomplete without travel_modes", () => {
    expect(isOnboardingComplete(userWithMeta({ full_name: "Pat" }))).toBe(false);
  });

  test("incomplete when travel_modes has no valid entries", () => {
    expect(isOnboardingComplete(userWithMeta({ full_name: "Pat", travel_modes: ["bike", 1] }))).toBe(false);
    expect(isOnboardingComplete(userWithMeta({ full_name: "Pat", travel_modes: [] }))).toBe(false);
  });

  test("complete with name and travel_modes", () => {
    expect(isOnboardingComplete(userWithMeta({ full_name: "Pat", travel_modes: ["driving"] }))).toBe(true);
  });

  test("isOnboardingComplete false for null user", () => {
    expect(isOnboardingComplete(null)).toBe(false);
    expect(isOnboardingComplete(undefined)).toBe(false);
  });

  test("readOnboardingFromUser defaults travel when missing", () => {
    const u = userWithMeta({ full_name: "Sam" });
    expect(readOnboardingFromUser(u)).toEqual({ fullName: "Sam", travelModes: ["driving"] });
  });

  test("readOnboardingFromUser parses and sorts travel_modes", () => {
    const u = userWithMeta({ full_name: "Lee", travel_modes: ["transit", "driving", "nope"] });
    expect(readOnboardingFromUser(u)).toEqual({
      fullName: "Lee",
      travelModes: ["driving", "transit"]
    });
  });
});
