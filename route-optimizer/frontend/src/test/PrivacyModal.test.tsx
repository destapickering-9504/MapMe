import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PrivacyModal } from "../components/PrivacyModal";

describe("PrivacyModal", () => {
  afterEach(() => cleanup());

  test("renders dialog copy when open", () => {
    render(<PrivacyModal open onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: /^Privacy$/ })).toBeTruthy();
    expect(screen.getByText(/We respect your privacy and keep things simple/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /What we collect/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /support@mapme\.app/i })).toBeTruthy();
  });
});
