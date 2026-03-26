import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import StoreInputForm from "../components/StoreInputForm";

describe("StoreInputForm", () => {
  afterEach(() => cleanup());

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
});
