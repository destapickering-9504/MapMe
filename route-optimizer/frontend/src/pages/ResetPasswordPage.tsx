import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MIN_PASSWORD_LEN } from "../auth/passwordRules";
import { describeSupabaseNetworkFailure, isLikelyNetworkAuthFailure } from "../lib/supabaseNetworkError";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";
import { PROFILE_PATH } from "../routes/paths";
import "../App.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) setSessionOk(true);
      setChecking(false);
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessionOk(true);
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const p = newPassword.trim();
    const c = confirm.trim();
    if (p.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (p !== c) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: p });
      if (err) throw err;
      navigate(PROFILE_PATH, { replace: true });
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

  if (!supabaseConfigured || !supabase) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">Reset password</h1>
        <p className="muted-small">Add Supabase environment variables to use password reset.</p>
        <p className="app-page-footer-links">
          <Link to="/">Back to sign in</Link>
        </p>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="app-page app-page-narrow">
        <p className="muted-small">Checking your reset link…</p>
      </main>
    );
  }

  if (!sessionOk) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">Reset link invalid or expired</h1>
        <p className="muted-small">
          Request a new link from the sign-in page (Forgot password), or open the link from your most recent email.
        </p>
        <p className="app-page-footer-links">
          <Link to="/">Back to sign in</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="app-page app-page-narrow">
      <h1 className="app-page-title">Choose a new password</h1>
      <p className="app-page-lead">Enter a new password twice, then continue to your profile.</p>

      <form className="auth-flow-form planner-card profile-section" onSubmit={(e) => void submit(e)}>
        <label className="auth-flow-label">
          <span className="auth-flow-label-text">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="auth-flow-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
            required
            minLength={MIN_PASSWORD_LEN}
          />
        </label>
        <label className="auth-flow-label">
          <span className="auth-flow-label-text">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            className="auth-flow-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Same as above"
            required
            minLength={MIN_PASSWORD_LEN}
          />
        </label>
        {error ? (
          <p className="auth-flow-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="auth-flow-primary" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
