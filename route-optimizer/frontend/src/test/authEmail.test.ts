import { describe, expect, test } from "vitest";
import {
  describeEmailOtpVerifyError,
  describePasswordSignInError,
  normalizeAuthEmail
} from "../lib/authEmail";

describe("normalizeAuthEmail", () => {
  test("trims and lowercases", () => {
    expect(normalizeAuthEmail("  User@EXAMPLE.com \n")).toBe("user@example.com");
  });
});

describe("describeEmailOtpVerifyError", () => {
  test("expands common OTP failure messages", () => {
    expect(describeEmailOtpVerifyError("Token has expired or is invalid")).toContain("Resend email");
    expect(describeEmailOtpVerifyError("otp_expired")).toContain("Resend email");
  });

  test("passes through other messages", () => {
    expect(describeEmailOtpVerifyError("Something else")).toBe("Something else");
  });
});

describe("describePasswordSignInError", () => {
  test("expands invalid login messages", () => {
    expect(describePasswordSignInError("Invalid login credentials")).toContain("Email code");
  });

  test("passes through other messages", () => {
    expect(describePasswordSignInError("Other")).toBe("Other");
  });
});
