import type { User } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";
import { isOnboardingComplete, readOnboardingFromUser } from "../auth/onboardingGate";

function userWithMeta(meta: Record<string, unknown>): User {
  return { user_metadata: meta } as User;
}

describe("onboardingGate", () => {
  test("incomplete without name", () => {
    expect(isOnboardingComplete(userWithMeta({ travel_modes: ["driving"] }))).toBe(false);
  });

  test("incomplete without travel_modes", () => {
    expect(isOnboardingComplete(userWithMeta({ full_name: "Pat" }))).toBe(false);
  });

  test("complete with name and travel_modes", () => {
    expect(isOnboardingComplete(userWithMeta({ full_name: "Pat", travel_modes: ["driving"] }))).toBe(true);
  });

  test("readOnboardingFromUser defaults travel when missing", () => {
    const u = userWithMeta({ full_name: "Sam" });
    expect(readOnboardingFromUser(u)).toEqual({ fullName: "Sam", travelModes: ["driving"] });
  });
});
