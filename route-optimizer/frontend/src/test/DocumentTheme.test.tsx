import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import DocumentTheme from "../components/DocumentTheme";
import { persistTheme, readStoredTheme } from "../components/AppHeader";

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

describe("DocumentTheme", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    restoreLocalStorage();
  });

  test("applies light theme from storage", () => {
    persistTheme("light");
    render(<DocumentTheme />);
    expect(readStoredTheme()).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("applies dark theme from storage", () => {
    persistTheme("dark");
    render(<DocumentTheme />);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
