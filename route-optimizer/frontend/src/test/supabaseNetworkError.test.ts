import { describe, expect, test } from "vitest";
import { describeSupabaseNetworkFailure, isLikelyNetworkAuthFailure } from "../lib/supabaseNetworkError";

describe("supabaseNetworkError", () => {
  test("isLikelyNetworkAuthFailure detects common messages", () => {
    expect(isLikelyNetworkAuthFailure("Failed to fetch")).toBe(true);
    expect(isLikelyNetworkAuthFailure("TypeError: Load failed")).toBe(true);
    expect(isLikelyNetworkAuthFailure("Invalid login credentials")).toBe(false);
  });

  test("isLikelyNetworkAuthFailure detects AuthRetryableFetchError", () => {
    expect(isLikelyNetworkAuthFailure("x", { name: "AuthRetryableFetchError" })).toBe(true);
  });

  test("describeSupabaseNetworkFailure includes url hint", () => {
    const s = describeSupabaseNetworkFailure("https://abc.supabase.co");
    expect(s).toContain("abc.supabase.co");
    expect(s).toContain("Checklist");
  });
});
