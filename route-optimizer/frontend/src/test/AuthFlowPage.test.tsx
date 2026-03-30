import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import AuthFlowPage from "../pages/AuthFlowPage";

vi.mock("../lib/supabaseClient", () => ({
  supabase: null,
  supabaseConfigured: false
}));

function renderAuthFlow() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthFlowPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AuthFlowPage", () => {
  afterEach(() => cleanup());

  test("step 1 shows split layout, email flow, and guest link", () => {
    renderAuthFlow();
    expect(screen.getByRole("heading", { name: /sign in or create your account/i })).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /continue/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /continue as guest/i }).getAttribute("href")).toBe("/routeoptimizer");
    expect(screen.getByRole("img", { name: /^MapMe$/i })).toBeTruthy();
  });

  test("password tab shows password field and sign in", () => {
    renderAuthFlow();
    fireEvent.click(screen.getByRole("tab", { name: /^password$/i }));
    expect(screen.getByPlaceholderText(/your password/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeTruthy();
  });
});
