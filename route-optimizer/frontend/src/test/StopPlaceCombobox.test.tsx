import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, test } from "vitest";
import StopPlaceCombobox from "../components/StopPlaceCombobox";
import type { ProfileSavedPlace } from "../domain/profileSavedPlaces";

const NO_SAVED: ProfileSavedPlace[] = [];
const savedTarget: ProfileSavedPlace[] = [
  { id: "t1", label: "Target", address: "100 Main St", query: "100 Main St" }
];

function Controlled({
  savedPlaces = NO_SAVED,
  initialValue = ""
}: {
  savedPlaces?: ProfileSavedPlace[];
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
        ariaLabel="stop-place-test"
        onTypingChange={(n) => {
          setPicked(null);
          setValue(n);
        }}
        onPickSaved={(loc) => {
          setPicked(`saved:${loc.id}`);
          setValue(loc.label);
        }}
      />
      <span data-testid="pick-kind">{picked ?? ""}</span>
    </>
  );
}

describe("StopPlaceCombobox", () => {
  afterEach(() => {
    cleanup();
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

  test("Escape closes the list", async () => {
    render(<Controlled savedPlaces={savedTarget} />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  test("no list when no saved places match filter", async () => {
    render(<Controlled savedPlaces={savedTarget} />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.change(input, { target: { value: "zzz nonmatching" } });
    fireEvent.focus(input);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  test("Enter selects highlighted saved row", async () => {
    render(<Controlled savedPlaces={savedTarget} />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect((input as HTMLInputElement).value).toBe("Target");
    expect(screen.getByTestId("pick-kind").textContent).toBe("saved:t1");
  });

  test("ArrowDown then Enter selects second saved row", async () => {
    const two: ProfileSavedPlace[] = [
      { id: "a", label: "Alpha", address: "1 St", query: "1" },
      { id: "b", label: "Beta", address: "2 St", query: "2" }
    ];
    render(<Controlled savedPlaces={two} />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect((input as HTMLInputElement).value).toBe("Beta");
    expect(screen.getByTestId("pick-kind").textContent).toBe("saved:b");
  });

  test("ArrowUp wraps from first row to last", async () => {
    const two: ProfileSavedPlace[] = [
      { id: "a", label: "Alpha", address: "1 St", query: "1" },
      { id: "b", label: "Beta", address: "2 St", query: "2" }
    ];
    render(<Controlled savedPlaces={two} />);
    const input = screen.getByLabelText("stop-place-test");
    fireEvent.focus(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect((input as HTMLInputElement).value).toBe("Beta");
    expect(screen.getByTestId("pick-kind").textContent).toBe("saved:b");
  });
});
