import { type FormEvent, useEffect, useState } from "react";
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
import { describePasswordSignInError, normalizeAuthEmail } from "../lib/authEmail";
import { describeSupabaseNetworkFailure, isLikelyNetworkAuthFailure } from "../lib/supabaseNetworkError";
import { MapMeLogoThemed } from "../components/MapMeLogo";
import { supabase } from "../lib/supabaseClient";
import { RESET_PASSWORD_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";
import "../App.css";

/** 1 = sign in / sign up, 2 = profile onboarding */
type Step = 1 | 2;

type AuthTab = "sign-in" | "sign-up";

export default function AuthFlowPage() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [authTab, setAuthTab] = useState<AuthTab>("sign-in");
  const [email, setEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState("");
  const [signUpEmailSent, setSignUpEmailSent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [travelModes, setTravelModes] = useState<TravelMode[]>(["driving"]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  useEffect(() => {
    if (!supabase || authLoading) return;

    if (authUser) {
      if (isOnboardingComplete(authUser)) {
        navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
        return;
      }
      const { fullName: fn, travelModes: modes } = readOnboardingFromUser(authUser);
      setFullName(fn);
      setTravelModes(modes);
      setStep(2);
      return;
    }

    setStep(1);
  }, [supabase, authLoading, authUser, navigate]);

  const handleSignUp = async (e: FormEvent) => {
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
    const p = signUpPassword.trim();
    const p2 = signUpPasswordConfirm.trim();
    if (!p || !p2) {
      setError("Enter and confirm your password.");
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
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: addr,
        password: p,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (err) {
        setError(
          isLikelyNetworkAuthFailure(err.message, err)
            ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
            : err.message
        );
        return;
      }
      setEmail(addr);
      if (data.session && data.user) {
        if (isOnboardingComplete(data.user)) {
          navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
          return;
        }
        const { fullName: fn, travelModes: tm } = readOnboardingFromUser(data.user);
        setFullName(fn);
        setTravelModes(tm);
        setStep(2);
        return;
      }
      setSignUpEmailSent(true);
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
      const signedInUser = data.user;
      if (signedInUser && isOnboardingComplete(signedInUser)) {
        navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
        return;
      }
      if (signedInUser) {
        const { fullName: fn, travelModes: tm } = readOnboardingFromUser(signedInUser);
        setFullName(fn);
        setTravelModes(tm);
      }
      setStep(2);
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
      navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
      return;
    }

    setBusy(true);
    setError(null);
    try {
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
    navigate(ROUTE_OPTIMIZER_PATH, { replace: true });
  };

  const switchAuthTab = (tab: AuthTab) => {
    setAuthTab(tab);
    setError(null);
    setForgotPasswordOpen(false);
    setForgotPasswordSent(false);
    setSignUpEmailSent(false);
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
          </nav>

          {step === 1 && (
            <>
              {!(authTab === "sign-up" && signUpEmailSent) ? (
                <>
                  <h1 className="auth-flow-title">Sign in or create your account</h1>
                  <p className="auth-flow-sub">
                    {authTab === "sign-in"
                      ? "Use the email and password for your account."
                      : "We&apos;ll send a link to verify your email. After that, sign in with the same password."}
                  </p>

                  <div className="auth-flow-method-toggle" role="tablist" aria-label="Account">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === "sign-in"}
                      onClick={() => switchAuthTab("sign-in")}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === "sign-up"}
                      onClick={() => switchAuthTab("sign-up")}
                    >
                      Sign up
                    </button>
                  </div>
                </>
              ) : null}

              {authTab === "sign-up" && signUpEmailSent ? (
                <>
                  <p className="auth-flow-badge">Check your email</p>
                  <h1 className="auth-flow-title">Verify your email</h1>
                  <p className="auth-flow-sub">
                    We sent a confirmation link to <strong>{email}</strong>. Open it to verify your account, then come
                    back and sign in with your password. Check spam if you don&apos;t see it within a few minutes.
                  </p>
                  <button
                    type="button"
                    className="auth-flow-primary"
                    onClick={() => {
                      setSignUpEmailSent(false);
                      switchAuthTab("sign-in");
                    }}
                  >
                    Back to sign in
                  </button>
                </>
              ) : authTab === "sign-up" ? (
                <form className="auth-flow-form" onSubmit={(e) => void handleSignUp(e)}>
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
                        autoComplete="new-password"
                        placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
                        className="auth-flow-input auth-flow-input-padded"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={MIN_PASSWORD_LEN}
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
                        value={signUpPasswordConfirm}
                        onChange={(e) => setSignUpPasswordConfirm(e.target.value)}
                        required
                        minLength={MIN_PASSWORD_LEN}
                      />
                    </span>
                  </label>
                  {error ? (
                    <p className="auth-flow-error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button type="submit" className="auth-flow-primary" disabled={busy}>
                    {busy ? "Creating account…" : "Create account"}
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

              {!signUpEmailSent && (
                <div className="auth-flow-info">
                  <span className="auth-flow-info-icon" aria-hidden>
                    🛡
                  </span>
                  <p>
                    <strong>Email and password only.</strong>{" "}
                    {authTab === "sign-up"
                      ? "Supabase sends the verification message; your password stays on the sign-in screen after you confirm."
                      : "New here? Use Sign up first, confirm your email, then sign in."}
                  </p>
                </div>
              )}

              <Link to={ROUTE_OPTIMIZER_PATH} className="auth-flow-guest">
                Continue as guest
              </Link>
            </>
          )}

          {step === 2 && (
            <>
              <p className="auth-flow-step-label">Step 2 of 2</p>
              <h1 className="auth-flow-title">Tell us about yourself</h1>
              <p className="auth-flow-sub">
                We need your name to continue. Pick one or more ways you travel.
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
                You can update travel modes later in settings.
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
