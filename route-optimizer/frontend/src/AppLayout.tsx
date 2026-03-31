import { useLayoutEffect } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";
import "./pages/history/historyRef.css";
import AppLayoutMobileNav from "./components/AppLayoutMobileNav";
import AppSidebar from "./components/AppSidebar";
import { FOOTER_SIDEBAR_INSET_PX } from "./lib/footerSidebarInset";
import { ThemeProvider } from "./theme/ThemeContext";

function AppLayoutInner() {
  useLayoutEffect(() => {
    const el = document.documentElement;
    el.dataset.footerSidebarInset = "true";
    el.style.setProperty("--app-footer-sidebar-inset", `${FOOTER_SIDEBAR_INSET_PX}px`);
    return () => {
      delete el.dataset.footerSidebarInset;
      el.style.removeProperty("--app-footer-sidebar-inset");
    };
  }, []);

  return (
    <div className="hm-history-root hm-ref hm-ref-page-with-sidebar">
      <AppSidebar />
      <div className="app-layout-main hm-ref-sidebar-main">
        <AppLayoutMobileNav />
        <div className="app-layout-outlet">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <ThemeProvider>
      <AppLayoutInner />
    </ThemeProvider>
  );
}
