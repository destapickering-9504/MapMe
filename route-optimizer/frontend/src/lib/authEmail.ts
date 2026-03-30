/** Supabase stores emails lowercased; OTP verification must use the same address as signInWithOtp. */
export function normalizeAuthEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Friendlier copy for GoTrue OTP errors (expired, wrong code, wrong template, superseded by resend). */
export function describeEmailOtpVerifyError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("expired") ||
    m.includes("invalid") ||
    m.includes("otp_expired") ||
    m.includes("token has expired")
  ) {
    return (
      "That code is wrong, expired, or was replaced by a newer one. Tap Resend email and enter only the " +
      "latest 6-digit code."
    );
  }
  return message;
}

/** Friendlier copy for email+password sign-in failures. */
export function describePasswordSignInError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_credentials") || m.includes("invalid credentials")) {
    return (
      "Wrong email or password. If you have not set a password yet, use Email code first, then add a password on the next screen."
    );
  }
  return message;
}
