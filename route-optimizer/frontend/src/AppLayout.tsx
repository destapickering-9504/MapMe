import { useLayoutEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./App.css";
import { useAuth } from "./auth/AuthContext";
import AppHeader, { persistTheme, readStoredTheme, type ThemeMode } from "./components/AppHeader";

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme());

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    persistTheme(theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0f1623" : "#FEA993");
    }
  }, [theme]);

  const displayName = useMemo(() => {
    if (authLoading && configured) return "…";
    if (!user) return "Guest";
    const meta = user.user_metadata;
    const fromProfile = typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
    if (fromProfile) return fromProfile;
    const fromEmail = user.email?.split("@")[0];
    return fromEmail && fromEmail.length > 0 ? fromEmail : "Account";
  }, [authLoading, configured, user]);

  const avatarUrl = useMemo(() => {
    const v = user?.user_metadata?.avatar_url;
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-layout">
      <AppHeader
        theme={theme}
        onThemeChange={setTheme}
        displayName={displayName}
        avatarUrl={avatarUrl}
        authConfigured={configured}
        isAuthenticated={Boolean(user)}
        onSignOut={handleSignOut}
      />
      <Outlet />
    </div>
  );
}
