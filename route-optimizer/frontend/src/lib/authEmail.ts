/** Supabase stores emails lowercased; use the same normalization for sign-up and sign-in. */
export function normalizeAuthEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Friendlier copy for email+password sign-in failures. */
export function describePasswordSignInError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_credentials") || m.includes("invalid credentials")) {
    return (
      "Wrong email or password. If you just signed up, open the verification link in your email first, then try again."
    );
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Confirm your email using the link we sent, then sign in with your password.";
  }
  return message;
}
