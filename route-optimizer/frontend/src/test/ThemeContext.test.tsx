import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";
import { persistTheme, readStoredTheme } from "../theme/themeStorage";

const origLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");

function installMemoryLocalStorage() {
  const store: Record<string, string> = {};
  const mock: Storage = {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      for (const k of Object.keys(store)) delete store[k];
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(i) {
      return Object.keys(store)[i] ?? null;
    },
    removeItem(key) {
      delete store[key];
    },
    setItem(key, value) {
      store[key] = String(value);
    }
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: mock });
}

function restoreLocalStorage() {
  if (origLocalStorage) Object.defineProperty(window, "localStorage", origLocalStorage);
}

function ThemeProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        go dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        go light
      </button>
    </div>
  );
}

describe("useTheme", () => {
  test("throws when used outside ThemeProvider", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bad() {
      useTheme();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/ThemeProvider/i);
    err.mockRestore();
  });
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    document.documentElement.removeAttribute("data-theme");
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", "#initial");
      document.head.appendChild(meta);
    }
  });

  afterEach(() => {
    cleanup();
    restoreLocalStorage();
  });

  test("syncs document dataset, storage, and theme-color meta when theme changes", () => {
    persistTheme("light");
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(readStoredTheme()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#FEA993");

    fireEvent.click(screen.getByRole("button", { name: /go dark/i }));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#0f1623");
  });
});
