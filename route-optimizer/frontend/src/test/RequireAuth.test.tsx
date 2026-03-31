import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import RequireAuth from "../auth/RequireAuth";

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => useAuthMock()
}));

describe("RequireAuth", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("shows loading state while session is resolving", () => {
    useAuthMock.mockReturnValue({ user: null, loading: true, configured: true });
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/checking sign-in/i)).toBeTruthy();
    expect(screen.queryByText("Secret")).toBeNull();
  });

  test("redirects guests to home", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, configured: true });
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.queryByText("Secret")).toBeNull();
  });

  test("renders child route when user is signed in", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1" },
      loading: false,
      configured: true
    });
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Secret")).toBeTruthy();
  });
});
