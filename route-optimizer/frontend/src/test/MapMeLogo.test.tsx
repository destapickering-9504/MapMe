import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import {
  MAPME_LOGO_DARK,
  MAPME_LOGO_LIGHT,
  MapMeLogoMark,
  MapMeLogoThemed,
  MapMePinMark
} from "../components/MapMeLogo";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

describe("MapMeLogoThemed", () => {
  test("uses logo-light when data-theme is light", () => {
    document.documentElement.dataset.theme = "light";
    const { container } = render(<MapMeLogoThemed />);
    expect(screen.getByRole("img", { name: "MapMe" })).toBeTruthy();
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute("src")).toBe(MAPME_LOGO_LIGHT);
  });

  test("uses logo-dark when data-theme is dark", () => {
    document.documentElement.dataset.theme = "dark";
    const { container } = render(<MapMeLogoThemed />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute("src")).toBe(MAPME_LOGO_DARK);
  });

  test("treats missing data-theme as light", () => {
    delete document.documentElement.dataset.theme;
    const { container } = render(<MapMeLogoThemed />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(MAPME_LOGO_LIGHT);
  });

  test("applies optional class names", () => {
    document.documentElement.dataset.theme = "light";
    const { container } = render(
      <MapMeLogoThemed className="wrap-extra" imgClassName=" img-extra " />
    );
    const wrap = container.firstElementChild;
    expect(wrap?.className).toContain("wrap-extra");
    const img = container.querySelector("img");
    expect(img?.className).toContain("img-extra");
  });
});

describe("MapMePinMark", () => {
  test("renders svg mark", () => {
    const { container } = render(<MapMePinMark className="pin-test" />);
    const svg = container.querySelector("svg.pin-test");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBeDefined();
  });
});

describe("MapMeLogoMark", () => {
  test("uses light asset for light theme", () => {
    render(<MapMeLogoMark theme="light" />);
    const img = screen.getByRole("img", { name: "MapMe" });
    expect(img.getAttribute("src")).toBe(MAPME_LOGO_LIGHT);
  });

  test("uses dark asset for dark theme and custom alt", () => {
    render(<MapMeLogoMark theme="dark" alt="MapMe logo" />);
    const img = screen.getByRole("img", { name: "MapMe logo" });
    expect(img.getAttribute("src")).toBe(MAPME_LOGO_DARK);
  });
});
