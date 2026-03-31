import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AuthProvider, useAuth, type AuthState } from "../auth/AuthContext";

const { getSessionMock, unsubscribeMock, signOutMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  signOutMock: vi.fn(() => Promise.resolve())
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => getSessionMock(),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      }),
      signOut: signOutMock
    }
  },
  supabaseConfigured: true
}));

function Probe({ onReady }: { onReady: (a: ReturnType<typeof useAuth>) => void }) {
  const a = useAuth();
  onReady(a);
  return <span data-testid="probe">{a.loading ? "loading" : "ready"}</span>;
}

describe("AuthProvider", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("exposes session after getSession resolves", async () => {
    const session = { user: { id: "u1", email: "a@b.com" } };
    getSessionMock.mockResolvedValue({ data: { session } });

    let captured: AuthState | null = null;

    render(
      <BrowserRouter>
        <AuthProvider>
          <Probe onReady={(a) => (captured = a)} />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("ready"));
    expect(captured).not.toBeNull();
    expect(captured!.session).toEqual(session);
    expect(captured!.configured).toBe(true);
  });

  test("signOut delegates to supabase", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    let captured: AuthState | null = null;

    render(
      <BrowserRouter>
        <AuthProvider>
          <Probe onReady={(a) => (captured = a)} />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("ready"));
    expect(captured).not.toBeNull();
    await captured!.signOut();
    expect(signOutMock).toHaveBeenCalled();
  });
});
