import { describe, expect, test } from "vitest";
import { profilePasswordRuleStates, validateProfileNewPassword } from "../auth/passwordRules";

describe("validateProfileNewPassword", () => {
  test("accepts a strong password", () => {
    expect(validateProfileNewPassword("Aa1!xyz99")).toBeNull();
  });

  test("requires length", () => {
    expect(validateProfileNewPassword("Aa1!x")).toMatch(/at least 8/i);
  });

  test("requires capital letter", () => {
    expect(validateProfileNewPassword("aa1!abcd")).toMatch(/capital letter/i);
  });

  test("requires digit", () => {
    expect(validateProfileNewPassword("Aa!abcdef")).toMatch(/digit/i);
  });

  test("requires special character", () => {
    expect(validateProfileNewPassword("Aa1abcdef")).toMatch(/special character/i);
  });

  test("allows password containing email-like or name-like text", () => {
    expect(validateProfileNewPassword("Xx1!jane.doe@example.com")).toBeNull();
    expect(validateProfileNewPassword("Xx1!jane.doe_extra")).toBeNull();
    expect(validateProfileNewPassword("Xx1!Jane_rules")).toBeNull();
  });
});

describe("profilePasswordRuleStates", () => {
  test("matches validateProfileNewPassword for strong and weak passwords", () => {
    const strong = "Aa1!xyz99";
    expect(validateProfileNewPassword(strong)).toBeNull();
    expect(profilePasswordRuleStates(strong).every((r) => r.pass)).toBe(true);

    const weak = "a";
    expect(validateProfileNewPassword(weak)).not.toBeNull();
    expect(profilePasswordRuleStates(weak).every((r) => r.pass)).toBe(false);
    expect(profilePasswordRuleStates(weak).filter((r) => r.pass).length).toBeLessThan(4);
  });

  test("four rules align with descriptions", () => {
    const states = profilePasswordRuleStates("Aa1!abcdef");
    expect(states).toHaveLength(4);
    expect(states.every((r) => r.pass)).toBe(true);
  });
});
