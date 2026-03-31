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

  test("step 1 shows split layout, sign-in form, and guest link", () => {
    renderAuthFlow();
    expect(screen.getByRole("heading", { name: /sign in or create your account/i })).toBeTruthy();
    expect(screen.getByLabelText(/email address/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /continue as guest/i }).getAttribute("href")).toBe("/routeoptimizer");
    expect(screen.getByRole("img", { name: /^MapMe$/i })).toBeTruthy();
  });

  test("sign up tab shows password fields and create account", () => {
    renderAuthFlow();
    fireEvent.click(screen.getByRole("tab", { name: /^sign up$/i }));
    expect(screen.getByPlaceholderText(/8\+ characters/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/same as above/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /create account/i })).toBeTruthy();
  });
});
