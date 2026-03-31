import { Outlet } from "react-router-dom";
import AppFooter from "./AppFooter";
import HelpModalProvider from "./HelpModal";
import PrivacyModalProvider from "./PrivacyModal";

/** Wraps every route: main content + shared footer. */
export default function AppRouteShell() {
  return (
    <PrivacyModalProvider>
      <HelpModalProvider>
        <div className="app-route-shell">
          <div className="app-route-shell-outlet">
            <Outlet />
          </div>
          <AppFooter />
        </div>
      </HelpModalProvider>
    </PrivacyModalProvider>
  );
}
