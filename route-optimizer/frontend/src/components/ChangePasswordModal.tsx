import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { MIN_PASSWORD_LEN } from "../auth/passwordRules";
import { describePasswordSignInError } from "../lib/authEmail";
import { describeSupabaseNetworkFailure, isLikelyNetworkAuthFailure } from "../lib/supabaseNetworkError";
import { supabase } from "../lib/supabaseClient";

interface Props {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  onSuccess: () => void;
}

export default function ChangePasswordModal({ open, onClose, userEmail, onSuccess }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setBusy(false);
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const cur = currentPassword;
    const next = newPassword.trim();
    const conf = confirmPassword.trim();
    if (!cur) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < MIN_PASSWORD_LEN) {
      setError(`New password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (next !== conf) {
      setError("New passwords do not match.");
      return;
    }
    if (next === cur) {
      setError("New password must be different from your current password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: cur
      });
      if (signErr) {
        setError(
          isLikelyNetworkAuthFailure(signErr.message, signErr)
            ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
            : describePasswordSignInError(signErr.message)
        );
        return;
      }
      const { error: upErr } = await supabase.auth.updateUser({ password: next });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        isLikelyNetworkAuthFailure(msg)
          ? describeSupabaseNetworkFailure(import.meta.env.VITE_SUPABASE_URL)
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="profile-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="profile-modal-title">
          Change password
        </h2>
        <p className="muted-small profile-modal-lead">
          Enter your current password, then your new password twice. Your current password is checked before anything is
          updated.
        </p>
        <form className="profile-modal-form" onSubmit={(e) => void handleSubmit(e)}>
          <label className="auth-flow-label">
            <span className="auth-flow-label-text">Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              className="auth-flow-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="auth-flow-label">
            <span className="auth-flow-label-text">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="auth-flow-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
            />
          </label>
          <label className="auth-flow-label">
            <span className="auth-flow-label-text">Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="auth-flow-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          {error ? (
            <p className="auth-flow-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="profile-modal-actions">
            <button type="button" className="auth-flow-secondary" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="auth-flow-primary" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
