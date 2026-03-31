import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AppLayout from "../AppLayout";
import { HELP_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => useAuthMock()
}));

function user(partial: Partial<User> & { user_metadata?: Record<string, unknown> }): User {
  return partial as User;
}

function renderLayout(initialPath = ROUTE_OPTIMIZER_PATH) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div data-testid="post-signout-outlet">Home</div>} />
          <Route path={ROUTE_OPTIMIZER_PATH} element={<div>Planner outlet</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AppLayout", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      configured: true,
      signOut: vi.fn().mockResolvedValue(undefined)
    });
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.footerSidebarInset;
    document.documentElement.style.removeProperty("--app-footer-sidebar-inset");
    vi.clearAllMocks();
  });

  test("shows Sign in link when unauthenticated (sidebar and mobile tabs)", () => {
    renderLayout();
    expect(screen.getAllByRole("link", { name: /^sign in$/i })).toHaveLength(2);
  });

  test("uses full_name from user metadata when present", () => {
    useAuthMock.mockReturnValue({
      user: user({
        email: "x@test.com",
        user_metadata: { full_name: "  Taylor  " }
      }),
      session: null,
      loading: false,
      configured: true,
      signOut: vi.fn().mockResolvedValue(undefined)
    });
    renderLayout();
    expect(screen.getByText("Taylor")).toBeTruthy();
  });

  test("falls back to email local part then Account", () => {
    useAuthMock.mockReturnValue({
      user: user({ email: "pat@example.com", user_metadata: {} }),
      session: null,
      loading: false,
      configured: true,
      signOut: vi.fn().mockResolvedValue(undefined)
    });
    renderLayout();
    expect(screen.getByText("pat")).toBeTruthy();
  });

  test("sign out calls auth and shows guest after state updates", async () => {
    const authState: {
      user: User | null;
      session: null;
      loading: boolean;
      configured: boolean;
      signOut: () => Promise<void>;
    } = {
      user: user({ email: "pat@example.com", user_metadata: { full_name: "Pat" } }),
      session: null,
      loading: false,
      configured: true,
      signOut: vi.fn(async () => {
        authState.user = null;
      })
    };
    useAuthMock.mockImplementation(() => authState);
    renderLayout();
    fireEvent.click(screen.getByRole("button", { name: /^sign out$/i }));
    expect(authState.signOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("post-signout-outlet")).toBeTruthy();
      expect(screen.getAllByRole("link", { name: /^sign in$/i }).length).toBeGreaterThanOrEqual(1);
    });
  });

  test("sets footer sidebar inset on document when signed-in user is on planner", () => {
    useAuthMock.mockReturnValue({
      user: user({ email: "a@b.co", user_metadata: {} }),
      session: null,
      loading: false,
      configured: true,
      signOut: vi.fn()
    });
    render(
      <MemoryRouter initialEntries={[ROUTE_OPTIMIZER_PATH]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path={ROUTE_OPTIMIZER_PATH} element={<div>out</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(document.documentElement.dataset.footerSidebarInset).toBe("true");
    expect(document.documentElement.style.getPropertyValue("--app-footer-sidebar-inset")).toBe("220px");
  });

  test("sets footer sidebar inset on help when signed in", () => {
    useAuthMock.mockReturnValue({
      user: user({ email: "a@b.co", user_metadata: {} }),
      session: null,
      loading: false,
      configured: true,
      signOut: vi.fn()
    });
    render(
      <MemoryRouter initialEntries={[HELP_PATH]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path={HELP_PATH} element={<div>out</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(document.documentElement.dataset.footerSidebarInset).toBe("true");
    expect(document.documentElement.style.getPropertyValue("--app-footer-sidebar-inset")).toBe("220px");
  });

  test("passes avatar URL from user metadata when set", () => {
    useAuthMock.mockReturnValue({
      user: user({
        email: "a@b.co",
        user_metadata: { full_name: "Riley", avatar_url: "https://cdn.example/face.png" }
      }),
      session: null,
      loading: false,
      configured: true,
      signOut: vi.fn()
    });
    const { container } = renderLayout();
    const avatar = container.querySelector(".app-sidebar-user-avatar");
    expect(avatar?.getAttribute("src")).toBe("https://cdn.example/face.png");
  });
});
