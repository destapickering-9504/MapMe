import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import StopPlaceCombobox from "../components/StopPlaceCombobox";
import type { ProfileSavedPlace } from "../domain/profileSavedPlaces";

const NO_SAVED: ProfileSavedPlace[] = [];
const savedTarget: ProfileSavedPlace[] = [
  { id: "t1", label: "Target", address: "100 Main St", query: "100 Main St" }
];

function Controlled({
  savedPlaces = NO_SAVED,
  includeAddressSuggestions = true,
  initialValue = ""
}: {
  savedPlaces?: ProfileSavedPlace[];
  includeAddressSuggestions?: boolean;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <>
      <StopPlaceCombobox
        inputId="spc-test"
        value={value}
        savedPlaces={savedPlaces}
        includeAddressSuggestions={includeAddressSuggestions}
        ariaLabel="stop-place-test"
        onTypingChange={(n) => {
          setPicked(null);
          setValue(n);
        }}
        onPickSaved={(loc) => {
          setPicked(`saved:${loc.id}`);
          setValue(loc.label);
        }}
        onPickAddressSuggestion={(label) => {
          setPicked(`api:${label}`);
          setValue(label);
        }}
      />
      <span data-testid="pick-kind">{picked ?? ""}</span>
    </>
  );
}

describe("StopPlaceCombobox", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          suggestions: [{ label: "456 Oak Ave, Springfield, USA", lat: 39.8, lng: -89.6 }]
        })
      })
    );
  });

  test("focus lists saved places and applies saved pick", async () => {
    render(<Controlled savedPlaces={savedTarget} />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.mouseDown(screen.getByRole("option", { name: /Target.*100 Main/i }));
    expect((input as HTMLInputElement).value).toBe("Target");
    expect(screen.getByTestId("pick-kind").textContent).toBe("saved:t1");
  });

  test("API suggestions when includeAddressSuggestions and no saved rows", async () => {
    render(<Controlled />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "456 oak" } });
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy(), { timeout: 2500 });
    fireEvent.mouseDown(screen.getByText(/456 Oak Ave, Springfield/i));
    expect(screen.getByTestId("pick-kind").textContent).toBe("api:456 Oak Ave, Springfield, USA");
  });

  test("saved and API rows show section divider when both exist", async () => {
    const office: ProfileSavedPlace[] = [
      { id: "o1", label: "Office", address: "456 Oak Street, Town, USA", query: "456 Oak Street, Town, USA" }
    ];
    render(<Controlled savedPlaces={office} />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.change(input, { target: { value: "456 oak" } });
    fireEvent.focus(input);
    await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThanOrEqual(2), { timeout: 2500 });
    expect(document.querySelector(".address-autocomplete-item-section-start")).toBeTruthy();
  });

  test("skips API fetch when includeAddressSuggestions is false", async () => {
    render(<Controlled savedPlaces={savedTarget} includeAddressSuggestions={false} />);
    vi.mocked(fetch).mockClear();
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.change(input, { target: { value: "some long typed query zzz" } });
    await waitFor(() => new Promise((r) => setTimeout(r, 400)));
    expect(fetch).not.toHaveBeenCalled();
  });
});
