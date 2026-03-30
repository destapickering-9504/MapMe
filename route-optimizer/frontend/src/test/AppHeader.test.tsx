import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import AppHeader, { persistTheme, readStoredTheme } from "../components/AppHeader";
import { PROFILE_PATH, ROUTE_HISTORY_PATH, ROUTE_OPTIMIZER_PATH } from "../routes/paths";

function renderHeader(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={ui} />
        <Route path={ROUTE_OPTIMIZER_PATH} element={<span>planner</span>} />
        <Route path={PROFILE_PATH} element={<span>profile</span>} />
        <Route path={ROUTE_HISTORY_PATH} element={<span>history</span>} />
      </Routes>
    </MemoryRouter>
  );
}

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
    renderHeader(
      <AppHeader
        theme="light"
        onThemeChange={onThemeChange}
        displayName="Guest"
        authConfigured={false}
        isAuthenticated={false}
        onSignOut={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Switch to dark mode/i }));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  test("guest shows sign in link and no account menu", () => {
    renderHeader(
      <AppHeader
        theme="light"
        onThemeChange={vi.fn()}
        displayName="Guest"
        authConfigured={true}
        isAuthenticated={false}
        onSignOut={vi.fn()}
      />
    );
    expect(screen.getByRole("link", { name: /^sign in$/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Guest/i })).toBeNull();
  });

  test("authenticated opens menu with profile, history, sign out", () => {
    const onSignOut = vi.fn();
    renderHeader(
      <AppHeader
        theme="light"
        onThemeChange={vi.fn()}
        displayName="alex"
        authConfigured={true}
        isAuthenticated={true}
        onSignOut={onSignOut}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /alex/i }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByText("Signed in as")).toBeTruthy();
    expect(within(menu).getByText("alex")).toBeTruthy();
    expect(within(menu).getByRole("menuitem", { name: /optimize route/i })).toBeTruthy();
    expect(within(menu).getByRole("menuitem", { name: /^profile$/i })).toBeTruthy();
    expect(within(menu).getByRole("menuitem", { name: /^history$/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));
    expect(onSignOut).toHaveBeenCalled();
  });

  test("shows profile avatar on trigger and in menu when avatarUrl is set", () => {
    const url = "https://example.com/avatar.jpg";
    const { container } = renderHeader(
      <AppHeader
        theme="light"
        onThemeChange={vi.fn()}
        displayName="alex"
        avatarUrl={url}
        authConfigured={true}
        isAuthenticated={true}
        onSignOut={vi.fn()}
      />
    );
    const triggerAvatar = container.querySelector(".app-header-user-avatar");
    expect(triggerAvatar?.getAttribute("src")).toBe(url);
    fireEvent.click(screen.getByRole("button", { name: /alex/i }));
    const menu = screen.getByRole("menu");
    const dropdownAvatar = menu.querySelector(".app-header-dropdown-avatar");
    expect(dropdownAvatar?.getAttribute("src")).toBe(url);
  });

  test("authenticated menu closes on outside click", () => {
    renderHeader(
      <AppHeader
        theme="light"
        onThemeChange={vi.fn()}
        displayName="alex"
        authConfigured={true}
        isAuthenticated={true}
        onSignOut={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /alex/i }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
