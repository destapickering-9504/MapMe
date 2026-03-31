import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, test } from "vitest";
import FeedbackPage from "../pages/FeedbackPage";
import { FEEDBACK_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";

function renderFeedback(entries: string[], index?: number) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={index}>
      <Routes>
        <Route path={ROUTE_OPTIMIZER_PATH} element={<div data-testid="planner-page">Planner</div>} />
        <Route path={FEEDBACK_PATH} element={<FeedbackPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("FeedbackPage", () => {
  afterEach(() => cleanup());

  test("shows coming soon dialog", () => {
    renderFeedback([FEEDBACK_PATH]);
    expect(screen.getByRole("dialog", { name: /coming soon/i })).toBeTruthy();
    expect(screen.getByText(/in-app feedback isn.t available yet/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^OK$/i })).toBeTruthy();
  });

  test("OK navigates back when history allows", () => {
    renderFeedback([ROUTE_OPTIMIZER_PATH, FEEDBACK_PATH], 1);
    fireEvent.click(screen.getByRole("button", { name: /^OK$/i }));
    expect(screen.getByTestId("planner-page")).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: /coming soon/i })).toBeNull();
  });

  test("OK goes to planner when feedback is the only history entry", () => {
    renderFeedback([FEEDBACK_PATH]);
    fireEvent.click(screen.getByRole("button", { name: /^OK$/i }));
    expect(screen.getByTestId("planner-page")).toBeTruthy();
  });
});
