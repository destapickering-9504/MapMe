import { NavLink } from "react-router-dom";
import { PROFILE_PATH, ROUTE_HISTORY_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";

export type PlannerRefSidebarSurface = "profile" | "history";

interface PlannerRefSidebarProps {
  surface: PlannerRefSidebarSurface;
}

export function PlannerRefSidebar({ surface }: PlannerRefSidebarProps) {
  const isHistory = surface === "history";

  const linkClass = ({ isActive }: { isActive: boolean }) => {
    if (isHistory) {
      return isActive ? "hm-ref-sidebar-link hm-ref-sidebar-link--active" : "hm-ref-sidebar-link";
    }
    return isActive ? "profile-ref-nav-link profile-ref-nav-link--active" : "profile-ref-nav-link";
  };

  const iconClass = isHistory ? "hm-ref-sidebar-icon" : "profile-ref-nav-icon";

  return (
    <aside className={isHistory ? "hm-ref-sidebar" : "profile-ref-sidebar"} aria-label="App navigation">
      <div className={isHistory ? "hm-ref-sidebar-brand" : "profile-ref-sidebar-brand"}>
        Map Me
        <span className={isHistory ? "hm-ref-sidebar-brand-tag" : "profile-ref-sidebar-brand-tag"}>
          Route planner
        </span>
      </div>
      <nav className={isHistory ? "hm-ref-sidebar-nav" : "profile-ref-nav"}>
        <NavLink to={ROUTE_OPTIMIZER_PATH} className={linkClass} end={false}>
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6.75H7.5a2.25 2.25 0 0 0-2.25 2.25v11.25A2.25 2.25 0 0 0 7.5 22.5h9a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3 3m0 0-3-3m3 3V15"
            />
          </svg>
          Planner
        </NavLink>
        <NavLink to={ROUTE_HISTORY_PATH} className={linkClass}>
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          History
        </NavLink>
        <NavLink to={PROFILE_PATH} className={linkClass} end>
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
          Profile
        </NavLink>
      </nav>
    </aside>
  );
}
