import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import AppLayout from "./AppLayout";
import AppRouteShell from "./components/AppRouteShell";
import DocumentTheme from "./components/DocumentTheme";
import AuthFlowPage from "./pages/AuthFlowPage";
import FeedbackPage from "./pages/FeedbackPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RouteHistoryPage from "./pages/RouteHistoryPage";
import RouteOptimizerPage from "./pages/RouteOptimizerPage";
import {
  FEEDBACK_PATH,
  PROFILE_PATH,
  RESET_PASSWORD_PATH,
  ROUTE_HISTORY_PATH,
  ROUTE_OPTIMIZER_PATH
} from "./routes/paths";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DocumentTheme />
      <AuthProvider>
        <Routes>
          <Route element={<AppRouteShell />}>
            <Route path="/" element={<AuthFlowPage />} />
            <Route path={RESET_PASSWORD_PATH} element={<ResetPasswordPage />} />
            <Route path="/sign-in" element={<Navigate to="/" replace />} />
            <Route path="/sign-up" element={<Navigate to="/" replace />} />
            <Route element={<AppLayout />}>
              <Route path={ROUTE_OPTIMIZER_PATH} element={<RouteOptimizerPage />} />
              <Route path={FEEDBACK_PATH} element={<FeedbackPage />} />
              <Route element={<RequireAuth />}>
                <Route path={PROFILE_PATH} element={<ProfilePage />} />
                <Route path={ROUTE_HISTORY_PATH} element={<RouteHistoryPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
