import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AppHeader, { persistTheme, readStoredTheme } from "../components/AppHeader";

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
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: mock
  });
}

function restoreLocalStorage() {
  if (origLocalStorage) {
    Object.defineProperty(window, "localStorage", origLocalStorage);
  }
}

describe("theme storage helpers", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    restoreLocalStorage();
  });

  test("readStoredTheme defaults to light", () => {
    expect(readStoredTheme()).toBe("light");
  });

  test("persistTheme and readStoredTheme roundtrip dark", () => {
    persistTheme("dark");
    expect(readStoredTheme()).toBe("dark");
    persistTheme("light");
    expect(readStoredTheme()).toBe("light");
  });

  test("readStoredTheme is light when localStorage is incomplete", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {}
    });
    expect(readStoredTheme()).toBe("light");
  });

  test("persistTheme ignores setItem failures", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        length: 0,
        clear: vi.fn(),
        getItem: () => null,
        key: () => null,
        removeItem: vi.fn(),
        setItem: () => {
          throw new Error("quota");
        }
      }
    });
    expect(() => persistTheme("dark")).not.toThrow();
  });
});

describe("AppHeader", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    cleanup();
    restoreLocalStorage();
  });

  test("toggles theme via callback", () => {
    const onThemeChange = vi.fn();
    render(<AppHeader theme="light" onThemeChange={onThemeChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Switch to dark mode/i }));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  test("opens account menu and closes on outside click", () => {
    render(<AppHeader theme="light" onThemeChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Guest/i }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
