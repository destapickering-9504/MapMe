import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import StartLocationCombobox from "../components/StartLocationCombobox";
import type { ProfileSavedPlace } from "../domain/profileSavedPlaces";

const NO_SAVED: ProfileSavedPlace[] = [];

const savedHome: ProfileSavedPlace[] = [
  { id: "h1", label: "Home", address: "123 Main St", query: "123 Main St" }
];

function Controlled({
  savedPlaces = NO_SAVED,
  initialValue = ""
}: {
  savedPlaces?: ProfileSavedPlace[];
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <StartLocationCombobox
      inputId="slc-test"
      value={value}
      onChange={setValue}
      savedPlaces={savedPlaces}
      ariaLabel="start-combo-test"
    />
  );
}

describe("StartLocationCombobox", () => {
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

  test("focus lists saved starts and fills on pick", async () => {
    render(<Controlled savedPlaces={savedHome} />);
    const input = screen.getByLabelText("start-combo-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.mouseDown(screen.getByRole("option", { name: /Home.*123 Main/i }));
    expect((input as HTMLInputElement).value).toBe("123 Main St");
  });

  test("debounced API suggestions fill on pick when no saved starts", async () => {
    render(<Controlled />);
    const input = screen.getByLabelText("start-combo-test");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "456 oak" } });
    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy(), { timeout: 2500 });
    fireEvent.mouseDown(screen.getByText(/456 Oak Ave, Springfield/i));
    expect((input as HTMLInputElement).value).toBe("456 Oak Ave, Springfield, USA");
  });

  test("saved rows and API rows show a section divider when both exist", async () => {
    const office: ProfileSavedPlace[] = [
      { id: "o1", label: "Office", address: "456 Oak Street, Town, USA", query: "456 Oak Street, Town, USA" }
    ];
    render(<Controlled savedPlaces={office} />);
    const input = screen.getByLabelText("start-combo-test");
    fireEvent.change(input, { target: { value: "456 oak" } });
    fireEvent.focus(input);
    await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThanOrEqual(2), { timeout: 2500 });
    expect(document.querySelector(".address-autocomplete-item-section-start")).toBeTruthy();
  });

  test("Escape closes the list", async () => {
    render(<Controlled savedPlaces={savedHome} />);
    const input = screen.getByLabelText("start-combo-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
