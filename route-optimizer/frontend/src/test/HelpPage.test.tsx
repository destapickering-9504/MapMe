import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test } from "vitest";
import HelpPage from "../pages/HelpPage";

function renderHelp() {
  return render(
    <MemoryRouter>
      <HelpPage />
    </MemoryRouter>
  );
}

describe("HelpPage", () => {
  afterEach(() => cleanup());

  test("renders quick start and contact", () => {
    const { container } = renderHelp();
    expect(screen.getByRole("heading", { level: 1, name: /^Help$/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Quick start/i })).toBeTruthy();
    const steps = container.querySelectorAll(".help-page__ol li");
    expect(steps.length).toBe(3);
    expect(steps[2]?.textContent ?? "").toMatch(/Optimize Route/);
    expect(screen.getByRole("heading", { name: /Still need help/i })).toBeTruthy();
    const mail = screen.getByRole("link", { name: /support@mapme\.app/i });
    expect(mail.getAttribute("href")).toContain("mailto:support@mapme.app");
  });

  test("FAQ expands and in-body links use correct paths", () => {
    renderHelp();
    expect(screen.getByRole("heading", { name: /Common questions/i })).toBeTruthy();
    const roundTripSummary = screen.getByText(/What.*difference between Round Trip/i).closest("summary")!;
    const roundTripDetails = roundTripSummary.closest("details")!;
    roundTripDetails.open = true;
    expect(within(roundTripDetails).getByText(/not routed back to the start/i)).toBeTruthy();

    const saveRoutes = screen.getByText(/Can I save routes/i).closest("summary")!;
    saveRoutes.closest("details")!.open = true;
    expect(screen.getByRole("link", { name: /^route history$/i }).getAttribute("href")).toBe("/route-history");
    expect(screen.getByRole("link", { name: /^the planner$/i }).getAttribute("href")).toBe("/routeoptimizer");

    const locationQ = screen.getByText(/Do you track my location/i).closest("summary")!;
    locationQ.closest("details")!.open = true;
    expect(screen.getByRole("link", { name: /^Privacy$/ }).getAttribute("href")).toBe("/privacy");
  });
});
