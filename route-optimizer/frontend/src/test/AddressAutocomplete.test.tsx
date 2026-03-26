import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AddressAutocomplete from "../components/AddressAutocomplete";

const suggestionsPayload = {
  suggestions: [
    { label: "123 Oak Street, Springfield, IL, USA", lat: 39.8, lng: -89.6 },
    { label: "123 Oak Lane, Portland, OR, USA", lat: 45.5, lng: -122.6 }
  ]
};

function ControlledAutocomplete({
  inputId,
  ariaLabel,
  initialValue = ""
}: {
  inputId: string;
  ariaLabel: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <AddressAutocomplete
      inputId={inputId}
      value={value}
      onChange={setValue}
      ariaLabel={ariaLabel}
    />
  );
}

describe("AddressAutocomplete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => suggestionsPayload
      })
    );
  });

  test("shows suggestions after debounce and fills on pick", async () => {
    render(
      <ControlledAutocomplete inputId="ac-test" ariaLabel="address-test" />
    );
    const input = screen.getByLabelText("address-test");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "123 oak" } });

    await waitFor(
      () => {
        expect(screen.getByRole("listbox")).toBeTruthy();
      },
      { timeout: 2000 }
    );

    fireEvent.mouseDown(screen.getByText(/123 Oak Street, Springfield/i));
    await waitFor(() => {
      expect((screen.getByLabelText("address-test") as HTMLInputElement).value).toBe(
        "123 Oak Street, Springfield, IL, USA"
      );
    });
  });

  test("Enter selects second row after ArrowDown", async () => {
    render(
      <ControlledAutocomplete
        inputId="ac-enter"
        ariaLabel="address-enter"
        initialValue="123 oak"
      />
    );
    fireEvent.focus(screen.getByLabelText("address-enter"));

    await waitFor(() => expect(screen.getByRole("listbox")).toBeTruthy(), { timeout: 2000 });

    const input = screen.getByLabelText("address-enter");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("123 Oak Lane, Portland, OR, USA");
    });
  });
});
