import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import StoreInputForm from "../components/StoreInputForm";

describe("StoreInputForm", () => {
  afterEach(() => cleanup());

  test("prefills origin when a saved start location is selected", async () => {
    const onSubmit = vi.fn();
    render(
      <StoreInputForm
        onSubmit={onSubmit}
        savedStartLocations={[
          { id: "h1", label: "Home", address: "Oakland, CA 94102", query: "Home, Oakland, CA 94102" }
        ]}
      />
    );
    const originInput = screen.getByLabelText("origin-place-input");
    fireEvent.focus(originInput);
    const homeOption = await screen.findByRole("option", { name: /Home.*Oakland/i });
    fireEvent.mouseDown(homeOption);
    expect((originInput as HTMLInputElement).value).toBe("Oakland, CA 94102");
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Target" }
    });
    fireEvent.change(screen.getByLabelText("Stop 2 store or place name"), {
      target: { value: "Whole Foods" }
    });
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].origin_place).toBe("Oakland, CA 94102");
  });

  test("submits store names from stop rows", () => {
    const onSubmit = vi.fn();
    render(<StoreInputForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "Los Angeles, CA" }
    });
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Target" }
    });
    fireEvent.change(screen.getByLabelText("Stop 2 store or place name"), {
      target: { value: "Trader Joe's" }
    });
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.origin_place).toBe("Los Angeles, CA");
    expect(payload.stores).toEqual(["Target", "Trader Joe's"]);
    expect(payload.trip_mode).toBe("round_trip");
    expect(payload.destination_place).toBeUndefined();
  });

  test("combines name and address when specific address is enabled", () => {
    const onSubmit = vi.fn();
    render(<StoreInputForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "Seattle, WA" }
    });
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Petco" }
    });
    fireEvent.click(screen.getByLabelText("Stop 1 use specific address"));
    fireEvent.change(screen.getByLabelText("Stop 1 specific address"), {
      target: { value: "2001 15th Ave W" }
    });
    fireEvent.change(screen.getByLabelText("Stop 2 store or place name"), {
      target: { value: "Whole Foods" }
    });
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.stores).toEqual(["Petco, 2001 15th Ave W", "Whole Foods"]);
  });

  test("dedupes POI name when address autocomplete repeats the place name", () => {
    const onSubmit = vi.fn();
    render(<StoreInputForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "Seattle, WA" }
    });
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Cheesecake Factory" }
    });
    fireEvent.click(screen.getByLabelText("Stop 1 use specific address"));
    fireEvent.change(screen.getByLabelText("Stop 1 specific address"), {
      target: {
        value: "The Cheesecake Factory, Alderwood Mall Parkway, Lynnwood, WA, USA"
      }
    });
    fireEvent.change(screen.getByLabelText("Stop 2 store or place name"), {
      target: { value: "Whole Foods" }
    });
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].stores[0]).toBe(
      "Cheesecake Factory, Alderwood Mall Parkway, Lynnwood, WA, USA"
    );
  });

  test("blocks submit when fewer than two named stops", () => {
    const onSubmit = vi.fn();
    render(<StoreInputForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "Seattle, WA" }
    });
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Target" }
    });
    fireEvent.change(screen.getByLabelText("Stop 2 store or place name"), {
      target: { value: "   " }
    });
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/at least 2 stops/i);
  });

  test("blocks submit when specific address is on but address empty", () => {
    const onSubmit = vi.fn();
    render(<StoreInputForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "Seattle, WA" }
    });
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Petco" }
    });
    fireEvent.click(screen.getByLabelText("Stop 1 use specific address"));
    fireEvent.change(screen.getByLabelText("Stop 2 store or place name"), {
      target: { value: "Whole Foods" }
    });
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/specific address/i);
  });

  test("blocks submit when starting location is empty", () => {
    const onSubmit = vi.fn();
    render(<StoreInputForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "   " }
    });
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("starting address");
  });

  test("add stop appends a row", () => {
    render(<StoreInputForm onSubmit={vi.fn()} />);
    expect(screen.getAllByLabelText(/Stop \d store or place name/)).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Add another stop/i }));
    expect(screen.getAllByLabelText(/Stop \d store or place name/)).toHaveLength(3);
  });

  test("same saved location cannot be selected on two stops", async () => {
    const onSubmit = vi.fn();
    const savedLocations = [
      { id: "s1", name: "Target", address: "100 Main St" },
      { id: "s2", name: "Whole Foods", address: "200 Oak Ave" }
    ];
    render(
      <StoreInputForm
        onSubmit={onSubmit}
        savedLocations={savedLocations}
      />
    );
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "Seattle, WA" }
    });
    const stop1Input = screen.getByLabelText("Stop 1 store or place name");
    fireEvent.focus(stop1Input);
    fireEvent.mouseDown(await screen.findByRole("option", { name: /Target.*100 Main/i }));

    const stop2Input = screen.getByLabelText("Stop 2 store or place name");
    fireEvent.focus(stop2Input);
    await screen.findByRole("listbox");
    const stop2Options = screen.getAllByRole("option").map((el) => el.textContent ?? "");
    expect(stop2Options.some((t) => t.includes("Target") && t.includes("100 Main"))).toBe(false);
    expect(stop2Options.some((t) => t.includes("Whole Foods"))).toBe(true);
    fireEvent.mouseDown(screen.getByRole("option", { name: /Whole Foods.*200 Oak/i }));
    fireEvent.click(screen.getByText("Optimize Route"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].stores).toEqual(["Target, 100 Main St", "Whole Foods, 200 Oak Ave"]);
  });

  test("shows save-to-profile when logged-in handler provided and specific address filled", async () => {
    const onSubmit = vi.fn();
    const onSaveLocationToProfile = vi.fn().mockResolvedValue({ ok: true });
    render(
      <StoreInputForm
        onSubmit={onSubmit}
        onSaveLocationToProfile={onSaveLocationToProfile}
      />
    );
    fireEvent.change(screen.getByLabelText("origin-place-input"), {
      target: { value: "Seattle, WA" }
    });
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Petco" }
    });
    fireEvent.click(screen.getByLabelText("Stop 1 use specific address"));
    fireEvent.change(screen.getByLabelText("Stop 1 specific address"), {
      target: { value: "500 Pine St" }
    });
    const saveBtn = screen.getByRole("button", { name: /Save stop 1 to profile locations/i });
    expect(saveBtn).toBeTruthy();
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(onSaveLocationToProfile).toHaveBeenCalledWith("Petco", "500 Pine St");
    });
    expect(await screen.findByText("Saved to your profile.")).toBeTruthy();
  });

  test("does not show save-to-profile without handler", () => {
    render(<StoreInputForm onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Petco" }
    });
    fireEvent.click(screen.getByLabelText("Stop 1 use specific address"));
    fireEvent.change(screen.getByLabelText("Stop 1 specific address"), {
      target: { value: "500 Pine St" }
    });
    expect(screen.queryByRole("button", { name: /Save stop 1 to profile locations/i })).toBeNull();
  });

  test("shows error message when save-to-profile fails", async () => {
    const onSaveLocationToProfile = vi.fn().mockResolvedValue({ ok: false, message: "Network error" });
    render(<StoreInputForm onSubmit={vi.fn()} onSaveLocationToProfile={onSaveLocationToProfile} />);
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Petco" }
    });
    fireEvent.click(screen.getByLabelText("Stop 1 use specific address"));
    fireEvent.change(screen.getByLabelText("Stop 1 specific address"), {
      target: { value: "500 Pine St" }
    });
    fireEvent.click(screen.getByRole("button", { name: /Save stop 1 to profile locations/i }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Network error");
  });

  test("shows already saved hint when stop matches a saved location", () => {
    render(
      <StoreInputForm
        onSubmit={vi.fn()}
        savedLocations={[{ id: "x", name: "Petco", address: "500 Pine St" }]}
        onSaveLocationToProfile={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText("Stop 1 store or place name"), {
      target: { value: "Petco" }
    });
    fireEvent.click(screen.getByLabelText("Stop 1 use specific address"));
    fireEvent.change(screen.getByLabelText("Stop 1 specific address"), {
      target: { value: "500 Pine St" }
    });
    expect(screen.getByText(/Already in your saved locations/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Save stop 1 to profile locations/i })).toBeNull();
  });
});
