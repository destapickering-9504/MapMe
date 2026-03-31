import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Renders child routes only when a session exists. Guests are sent to the auth flow.
 * Waits for initial session resolution when Supabase is configured to avoid a flash redirect.
 */
export default function RequireAuth() {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (configured && loading) {
    return (
      <main className="app-page app-page-narrow" aria-busy="true" aria-live="polite">
        <p className="muted-small">Checking sign-in…</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
