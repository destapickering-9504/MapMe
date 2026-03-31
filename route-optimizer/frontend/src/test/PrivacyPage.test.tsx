import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import PrivacyPage from "../pages/PrivacyPage";

describe("PrivacyPage", () => {
  test("renders policy sections and support mailto", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { level: 1, name: /^Privacy$/ })).toBeTruthy();
    expect(screen.getByText(/We respect your privacy and keep things simple/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /What we collect/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /How we use it/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /What we don’t do/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Data storage/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Contact/i })).toBeTruthy();
    const mail = screen.getByRole("link", { name: /support@mapme\.app/i });
    expect(mail.getAttribute("href")).toContain("mailto:support@mapme.app");
  });
});
