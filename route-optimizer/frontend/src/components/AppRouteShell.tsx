import { Outlet } from "react-router-dom";
import AppFooter from "./AppFooter";

/** Wraps every route: main content + shared footer. */
export default function AppRouteShell() {
  return (
    <div className="app-route-shell">
      <div className="app-route-shell-outlet">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
}
