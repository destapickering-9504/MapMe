import { describe, expect, test } from "vitest";
import { describePasswordSignInError, normalizeAuthEmail } from "../lib/authEmail";

describe("normalizeAuthEmail", () => {
  test("trims and lowercases", () => {
    expect(normalizeAuthEmail("  User@EXAMPLE.com \n")).toBe("user@example.com");
  });
});

describe("describePasswordSignInError", () => {
  test("expands invalid login messages", () => {
    expect(describePasswordSignInError("Invalid login credentials")).toContain("verification");
  });

  test("mentions email confirmation when applicable", () => {
    expect(describePasswordSignInError("Email not confirmed")).toContain("Confirm your email");
  });

  test("passes through other messages", () => {
    expect(describePasswordSignInError("Other")).toBe("Other");
  });
});
