import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  isOnboardingComplete,
  readOnboardingFromUser,
  sortTravelModes,
  toggleTravelMode,
  type TravelMode
} from "../auth/onboardingGate";
import { MIN_PASSWORD_LEN } from "../auth/passwordRules";
import { useAuth } from "../auth/AuthContext";
import { TRAVEL_MODE_UI } from "../domain/travelModesUi";
import {
  describeEmailOtpVerifyError,
  describePasswordSignInError,
  normalizeAuthEmail
} from "../lib/authEmail";
import { describeSupabaseNetworkFailure, isLikelyNetworkAuthFailure } from "../lib/supabaseNetworkError";
import { MapMeLogoThemed } from "../components/MapMeLogo";
import { supabase } from "../lib/supabaseClient";
import { PROFILE_PATH, RESET_PASSWORD_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import "../App.css";

type Step = 1 | 2 | 3;
type Step1Mode = "otp" | "password";

/** User requested a code; used to restore step 2 after refresh. */
const SS_AUTH_PENDING = "mapme-auth-awaiting";
const SS_AUTH_EMAIL = "mapme-auth-pending-email";

function OtpRow({
  otp,
  onChange,
  disabled
}: {
  otp: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, ch: string) => {
    const d = ch.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = d;
    onChange(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!raw) return;
    const next = [...otp];
    for (let k = 0; k < 6; k++) next[k] = raw[k] ?? "";
    onChange(next);
    const last = Math.min(raw.length, 5);
    refs.current[last]?.focus();
  };

  return (
    <div className="auth-flow-otp-row" onPaste={onPaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="auth-flow-otp-cell"
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of 6`}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

export default function AuthFlowPage() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [fullName, setFullName] = useState("");
  const [travelModes, setTravelModes] = useState<TravelMode[]>(["driving"]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const [step1Mode, setStep1Mode] = useState<Step1Mode>("otp");
  const [signInPassword, setSignInPassword] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState("");
  const [signedInWithPassword, setSignedInWithPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = window.setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [resendSec]);

  const clearPendingAuth = useCallback(() => {
    try {
      sessionStorage.removeItem(SS_AUTH_PENDING);
      sessionStorage.removeItem(SS_AUTH_EMAIL);
    } catch {
      /* private mode */
    }
  }, []);

  /** Restore email, OTP step, or skip onboarding when already signed in with a complete profile. */
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(SS_AUTH_EMAIL);
    } catch {
      /* ignore */
    }
    if (stored) setEmail(normalizeAuthEmail(stored));

    if (!supabase || authLoading) return;

    let pending = false;
    try {
      pending = sessionStorage.getItem(SS_AUTH_PENDING) === "1";
    } catch {
      /* ignore */
    }

    if (authUser && pending) {
      try {
        sessionStorage.removeItem(SS_AUTH_PENDING);
      } catch {
        /* ignore */
      }
      if (isOnboardingComplete(authUser)) {
        navigate(PROFILE_PATH, { replace: true });
        return;
      }
      const { fullName, travelModes: modes } = readOnboardingFromUser(authUser);
      setFullName(fullName);
      setTravelModes(modes);
      setStep(3);
      return;
    }

    if (pending && !authUser) {
      setStep(2);
      return;
    }

    if (authUser && !pending) {
      if (isOnboardingComplete(authUser)) {
        navigate(PROFILE_PATH, { replace: true });
        return;
      }
      const { fullName, travelModes: modes } = readOnboardingFromUser(authUser);
      setFullName(fullName);
      setTravelModes(modes);
      setStep(3);
    }
  }, [supabase, authLoading, authUser, navigate]);

  const sendOtp = useCallback(async () => {
    if (!supabase) {
      setError("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use email sign-in.");
      return false;
    }
    const addr = normalizeAuthEmail(email);
    if (!addr) {
      setError("Enter your email address.");
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: addr,
        options: {
          shouldCreateUser: true
        }
      });
      if (err) {
        setError(
          isLikelyNetworkAuthFailure(err.message, err)
            ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
            : err.message
        );
        return false;
      }
      setResendSec(30);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        isLikelyNetworkAuthFailure(msg)
          ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
          : msg
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, [email]);

  const handlePasswordSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use email sign-in.");
      return;
    }
    const addr = normalizeAuthEmail(email);
    if (!addr) {
      setError("Enter your email address.");
      return;
    }
    if (!signInPassword) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: addr,
        password: signInPassword
      });
      if (err) {
        setError(
          isLikelyNetworkAuthFailure(err.message, err)
            ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
            : describePasswordSignInError(err.message)
        );
        return;
      }
      setEmail(addr);
      clearPendingAuth();
      setSignedInWithPassword(true);
      const signedInUser = data.user;
      if (signedInUser && isOnboardingComplete(signedInUser)) {
        navigate(PROFILE_PATH, { replace: true });
        return;
      }
      if (signedInUser) {
        const { fullName: fn, travelModes: tm } = readOnboardingFromUser(signedInUser);
        setFullName(fn);
        setTravelModes(tm);
      }
      setStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        isLikelyNetworkAuthFailure(msg)
          ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use password reset.");
      return;
    }
    const addr = normalizeAuthEmail(email);
    if (!addr) {
      setError("Enter your email address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(addr, {
        redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`
      });
      if (err) {
        setError(
          isLikelyNetworkAuthFailure(err.message, err)
            ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
            : err.message
        );
        return;
      }
      setForgotPasswordSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        isLikelyNetworkAuthFailure(msg)
          ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await sendOtp();
    if (ok) {
      const addr = normalizeAuthEmail(email);
      try {
        sessionStorage.setItem(SS_AUTH_PENDING, "1");
        sessionStorage.setItem(SS_AUTH_EMAIL, addr);
      } catch {
        /* ignore */
      }
      setEmail(addr);
      setStep(2);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const token = otp.join("");
    if (token.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({
        email: normalizeAuthEmail(email),
        token,
        type: "email"
      });
      if (err) {
        setError(
          isLikelyNetworkAuthFailure(err.message, err)
            ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
            : describeEmailOtpVerifyError(err.message)
        );
        return;
      }
      try {
        sessionStorage.removeItem(SS_AUTH_PENDING);
      } catch {
        /* ignore */
      }
      setSignedInWithPassword(false);
      const verifiedUser = data.user;
      if (verifiedUser && isOnboardingComplete(verifiedUser)) {
        navigate(PROFILE_PATH, { replace: true });
        return;
      }
      if (verifiedUser) {
        const { fullName: fn, travelModes: tm } = readOnboardingFromUser(verifiedUser);
        setFullName(fn);
        setTravelModes(tm);
      }
      setStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(
        isLikelyNetworkAuthFailure(msg)
          ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const finishProfile = async () => {
    const name = fullName.trim();
    if (!name) {
      setError("Enter your name.");
      return;
    }
    if (travelModes.length === 0) {
      setError("Select at least one way you travel.");
      return;
    }

    if (!supabase) {
      clearPendingAuth();
      navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
      return;
    }

    const p = profilePassword.trim();
    const p2 = profilePasswordConfirm.trim();
    if (p || p2) {
      if (!p || !p2) {
        setError("Enter and confirm your new password, or clear both fields.");
        return;
      }
      if (p.length < MIN_PASSWORD_LEN) {
        setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
        return;
      }
      if (p !== p2) {
        setError("Passwords do not match.");
        return;
      }
    }

    setBusy(true);
    setError(null);
    try {
      if (p && p2) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password: p });
        if (pwdErr) {
          setError(pwdErr.message);
          return;
        }
      }
      await supabase.auth.updateUser({
        data: {
          full_name: name,
          travel_modes: sortTravelModes(travelModes)
        }
      });
    } catch {
      /* non-fatal for metadata */
    } finally {
      setBusy(false);
    }
    clearPendingAuth();
    navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
  };

  const leftFooter =
    step === 1 ? (
      <div className="auth-split-footer-card">
        <div className="auth-split-stars" aria-hidden>
          ★★★★★
        </div>
        <p className="auth-split-quote">&ldquo;This app saves me hours every week!&rdquo;</p>
        <p className="auth-split-quote-by">— Sarah K.</p>
        <span className="auth-split-pill">Loved by 10,000+ drivers</span>
      </div>
    ) : step === 2 ? (
      <div className="auth-split-footer-card auth-split-footer-muted">
        <p className="auth-split-secure">
          <span className="auth-split-secure-icon" aria-hidden>
            🔒
          </span>
          Secure &amp; private — your trips stay yours.
        </p>
        <button
          type="button"
          className="auth-flow-text-btn"
          onClick={() => {
            clearPendingAuth();
            setStep(1);
          }}
        >
          ← Change email address
        </button>
      </div>
    ) : (
      <div className="auth-split-footer-card auth-split-footer-muted">
        <p className="auth-split-almost">
          <span aria-hidden>🚀</span> You&apos;re almost in! This takes under 30 seconds.
        </p>
      </div>
    );

  return (
    <div className="auth-flow-page">
      <div className="auth-flow-shell">
        <aside className="auth-split-left" aria-label="MapMe">
          <div className="auth-split-brand">
            <MapMeLogoThemed className="auth-split-mapme-logo" />
          </div>
          <p className="auth-split-tagline">Plan smarter routes in seconds</p>
          <ul className="auth-split-benefits">
            <li>Optimize your stops</li>
            <li>Save time &amp; gas</li>
            <li>Stress-free errands</li>
          </ul>
          <div className="auth-split-map-art" aria-hidden>
            <div className="auth-split-map-pin auth-split-map-pin-1">1</div>
            <div className="auth-split-map-pin auth-split-map-pin-2">2</div>
            <div className="auth-split-map-pin auth-split-map-pin-3">3</div>
            <div className="auth-split-map-route" />
          </div>
          {leftFooter}
        </aside>

        <div className="auth-split-right">
          <nav className="auth-flow-steps" aria-label="Progress">
            <span className={step >= 1 ? "auth-flow-step-dot active" : "auth-flow-step-dot"}>1</span>
            <span className="auth-flow-step-line" />
            <span className={step >= 2 ? "auth-flow-step-dot active" : "auth-flow-step-dot"}>2</span>
            <span className="auth-flow-step-line" />
            <span className={step >= 3 ? "auth-flow-step-dot active" : "auth-flow-step-dot"}>3</span>
          </nav>

          {step === 1 && (
            <>
              <h1 className="auth-flow-title">Sign in or create your account</h1>
              <p className="auth-flow-sub">
                {step1Mode === "otp"
                  ? "We&apos;ll email you a code to sign in — or use a password if you&apos;ve already set one."
                  : "Use the email and password for your account (set a password after you verify with a code)."}
              </p>

              <div className="auth-flow-method-toggle" role="tablist" aria-label="Sign-in method">
                <button
                  type="button"
                  role="tab"
                  aria-selected={step1Mode === "otp"}
                  onClick={() => {
                    setStep1Mode("otp");
                    setError(null);
                    setForgotPasswordOpen(false);
                    setForgotPasswordSent(false);
                  }}
                >
                  Email code
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={step1Mode === "password"}
                  onClick={() => {
                    setStep1Mode("password");
                    setError(null);
                    setForgotPasswordOpen(false);
                    setForgotPasswordSent(false);
                  }}
                >
                  Password
                </button>
              </div>

              {step1Mode === "otp" ? (
                <form className="auth-flow-form" onSubmit={handleStep1Submit}>
                  <label className="auth-flow-label">
                    <span className="auth-flow-label-text">Email address</span>
                    <span className="auth-flow-input-wrap">
                      <span className="auth-flow-input-icon" aria-hidden>
                        ✉
                      </span>
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="auth-flow-input auth-flow-input-padded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </span>
                  </label>
                  {error ? (
                    <p className="auth-flow-error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button type="submit" className="auth-flow-primary" disabled={busy}>
                    {busy ? "Sending…" : "Continue →"}
                  </button>
                </form>
              ) : forgotPasswordSent ? (
                <>
                  <p className="auth-flow-badge">Check your email</p>
                  <h1 className="auth-flow-title">Reset link sent</h1>
                  <p className="auth-flow-sub">
                    If an account exists for <strong>{email}</strong>, we sent a message with a link to choose a new
                    password. Open it on this device (check spam if needed).
                  </p>
                  <button
                    type="button"
                    className="auth-flow-primary"
                    onClick={() => {
                      setForgotPasswordOpen(false);
                      setForgotPasswordSent(false);
                      setError(null);
                    }}
                  >
                    Back to sign in
                  </button>
                </>
              ) : forgotPasswordOpen ? (
                <form className="auth-flow-form" onSubmit={(e) => void handleForgotPasswordSubmit(e)}>
                  <p className="auth-flow-sub">
                    Enter the email for your account. We&apos;ll send a link to verify it&apos;s you and set a new
                    password.
                  </p>
                  <label className="auth-flow-label">
                    <span className="auth-flow-label-text">Email address</span>
                    <span className="auth-flow-input-wrap">
                      <span className="auth-flow-input-icon" aria-hidden>
                        ✉
                      </span>
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="auth-flow-input auth-flow-input-padded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </span>
                  </label>
                  {error ? (
                    <p className="auth-flow-error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button type="submit" className="auth-flow-primary" disabled={busy}>
                    {busy ? "Sending…" : "Send reset link"}
                  </button>
                  <button
                    type="button"
                    className="auth-flow-text-btn auth-flow-back"
                    onClick={() => {
                      setForgotPasswordOpen(false);
                      setError(null);
                    }}
                  >
                    ← Back to sign in
                  </button>
                </form>
              ) : (
                <form className="auth-flow-form" onSubmit={(e) => void handlePasswordSignIn(e)}>
                  <label className="auth-flow-label">
                    <span className="auth-flow-label-text">Email address</span>
                    <span className="auth-flow-input-wrap">
                      <span className="auth-flow-input-icon" aria-hidden>
                        ✉
                      </span>
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="auth-flow-input auth-flow-input-padded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </span>
                  </label>
                  <label className="auth-flow-label">
                    <span className="auth-flow-label-text">Password</span>
                    <span className="auth-flow-input-wrap">
                      <span className="auth-flow-input-icon" aria-hidden>
                        🔑
                      </span>
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Your password"
                        className="auth-flow-input auth-flow-input-padded"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                      />
                    </span>
                  </label>
                  <div className="auth-flow-forgot-row">
                    <button
                      type="button"
                      className="auth-flow-text-btn"
                      onClick={() => {
                        setForgotPasswordOpen(true);
                        setForgotPasswordSent(false);
                        setError(null);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  {error ? (
                    <p className="auth-flow-error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button type="submit" className="auth-flow-primary" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              )}

              <div className="auth-flow-info">
                <span className="auth-flow-info-icon" aria-hidden>
                  🛡
                </span>
                <p>
                  {step1Mode === "otp" ? (
                    <>
                      <strong>Email code.</strong> We&apos;ll send a 6-digit code. After you verify, you can add a
                      password on the next screen for faster sign-in later.
                    </>
                  ) : (
                    <>
                      <strong>Password sign-in</strong> works after you&apos;ve set a password using Email code once,
                      then saved it on the profile step.
                    </>
                  )}
                </p>
              </div>

              <p className="auth-flow-footnote">
                New here? Use <strong>Email code</strong> first — then optionally set a password before opening the
                planner.
              </p>

              <Link to={ROUTE_OPTIMIZER_PATH} className="auth-flow-guest">
                Continue as guest
              </Link>
            </>
          )}

          {step === 2 && (
            <form className="auth-flow-form" onSubmit={handleVerifyOtp}>
              <p className="auth-flow-badge">Check your email</p>
              <h1 className="auth-flow-title">Confirm it&apos;s you</h1>
              <p className="auth-flow-sub">
                We emailed <strong>{email}</strong> a <strong>6-digit code</strong>. Enter it below (it expires in a few
                minutes).
              </p>

              <p className="auth-flow-label-text auth-flow-otp-heading">Verification code</p>
              <OtpRow otp={otp} onChange={setOtp} disabled={busy} />
              {error ? (
                <p className="auth-flow-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="auth-flow-primary" disabled={busy}>
                {busy ? "Verifying…" : "Verify"}
              </button>
              <div className="auth-flow-resend-row">
                <button
                  type="button"
                  className="auth-flow-text-btn"
                  disabled={resendSec > 0 || busy}
                  onClick={() => void sendOtp().then((ok) => ok && setResendSec(30))}
                >
                  {resendSec > 0 ? `Resend email (${resendSec}s)` : "Resend email"}
                </button>
              </div>
              <button
                type="button"
                className="auth-flow-text-btn auth-flow-back"
                onClick={() => {
                  clearPendingAuth();
                  setStep(1);
                }}
              >
                ← Go back
              </button>
              <p className="auth-flow-tip">Pro tip: check spam if you don&apos;t see it within a minute.</p>
            </form>
          )}

          {step === 3 && (
            <>
              <p className="auth-flow-step-label">Step 2 of 2</p>
              <h1 className="auth-flow-title">Tell us about yourself</h1>
              <p className="auth-flow-sub">
                We need your name to continue. Pick one or more ways you travel; password below stays optional.
              </p>

              <label className="auth-flow-label">
                <span className="auth-flow-label-text">Full name (required)</span>
                <span className="auth-flow-input-wrap">
                  <span className="auth-flow-input-icon" aria-hidden>
                    👤
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="What should we call you?"
                    className="auth-flow-input auth-flow-input-padded"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    aria-required={true}
                  />
                </span>
              </label>

              <p className="auth-flow-label-text auth-flow-travel-heading">
                {signedInWithPassword ? "Change password (optional)" : "Password for next time (optional)"}
              </p>
              <p className="auth-flow-sub auth-flow-sub-tight">
                {signedInWithPassword ? (
                  <>
                    Leave these blank to keep your current password, or enter a new one twice to update it before you
                    continue.
                  </>
                ) : (
                  <>
                    After your email is verified, you can save a password and use the <strong>Password</strong> tab on
                    the sign-in screen next visit.
                  </>
                )}
              </p>
              <label className="auth-flow-label">
                <span className="auth-flow-label-text">New password</span>
                <span className="auth-flow-input-wrap">
                  <span className="auth-flow-input-icon" aria-hidden>
                    🔑
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
                    className="auth-flow-input auth-flow-input-padded"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                  />
                </span>
              </label>
              <label className="auth-flow-label">
                <span className="auth-flow-label-text">Confirm password</span>
                <span className="auth-flow-input-wrap">
                  <span className="auth-flow-input-icon" aria-hidden>
                    🔑
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Same as above"
                    className="auth-flow-input auth-flow-input-padded"
                    value={profilePasswordConfirm}
                    onChange={(e) => setProfilePasswordConfirm(e.target.value)}
                  />
                </span>
              </label>

              <p className="auth-flow-label-text auth-flow-travel-heading">How do you plan to travel?</p>
              <p className="auth-flow-sub auth-flow-sub-tight">Select all that apply. At least one must stay selected.</p>
              <div
                className="auth-flow-travel-grid"
                role="group"
                aria-label="Travel modes — select all that apply"
              >
                {TRAVEL_MODE_UI.map(({ id, title, sub }) => {
                  const selected = travelModes.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={
                        selected ? "auth-flow-travel-card auth-flow-travel-card-active" : "auth-flow-travel-card"
                      }
                      aria-pressed={selected}
                      onClick={() => setTravelModes((prev) => toggleTravelMode(prev, id))}
                    >
                      <span className="auth-flow-travel-title">{title}</span>
                      <span className="auth-flow-travel-sub">{sub}</span>
                      {selected ? <span className="auth-flow-travel-check">✓</span> : null}
                    </button>
                  );
                })}
              </div>

              <div className="auth-flow-gift">
                <span aria-hidden>🎁</span>
                You can update travel modes and password later in settings.
              </div>

              {error ? (
                <p className="auth-flow-error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="auth-flow-final-actions">
                <button
                  type="button"
                  className="auth-flow-primary"
                  disabled={busy}
                  onClick={() => void finishProfile()}
                >
                  Get started →
                </button>
              </div>
              <p className="auth-flow-redirect-note">✓ You&apos;ll land on the Route Optimizer next.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
