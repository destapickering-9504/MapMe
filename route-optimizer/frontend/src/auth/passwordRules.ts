/** Minimum length for sign-up, reset-password, and other flows (Supabase-compatible). */
export const MIN_PASSWORD_LEN = 6;

/** Stricter policy for sign-up, reset-from-email, and profile change-password (client-side; Supabase still enforces its own minimum). */
export const PROFILE_PASSWORD_MIN_LENGTH = 8;

/**
 * Client-side validation for “change password” on the profile screen.
 * Returns an error message or null if valid.
 */
export function validateProfileNewPassword(password: string): string | null {
  if (password.length < PROFILE_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PROFILE_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one capital letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must include at least one digit.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}

/** Shown next to the profile change-password form. */
export const PROFILE_PASSWORD_RULE_DESCRIPTIONS: string[] = [
  `At least ${PROFILE_PASSWORD_MIN_LENGTH} characters`,
  "At least one capital letter (A–Z)",
  "At least one digit (0–9)",
  "At least one special character (e.g. ! @ # $ %)"
];

/** One row for sign-up / change-password UI (live checklist). Order matches `PROFILE_PASSWORD_RULE_DESCRIPTIONS`. */
export interface ProfilePasswordRuleState {
  id: string;
  label: string;
  pass: boolean;
}

/**
 * Live rule status while typing. Uses the same rules as `validateProfileNewPassword` (raw `password` string, not trimmed).
 */
export function profilePasswordRuleStates(password: string): ProfilePasswordRuleState[] {
  const minLen = password.length >= PROFILE_PASSWORD_MIN_LENGTH;
  const upper = /[A-Z]/.test(password);
  const digit = /\d/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);

  const labels = PROFILE_PASSWORD_RULE_DESCRIPTIONS;
  return [
    { id: "len", label: labels[0]!, pass: minLen },
    { id: "upper", label: labels[1]!, pass: upper },
    { id: "digit", label: labels[2]!, pass: digit },
    { id: "special", label: labels[3]!, pass: special }
  ];
}
