import React from "react";
import { vi } from "vitest";

function createMatchMediaList(query: string, matches: boolean): MediaQueryList {
  const mql = {
    media: query,
    matches,
    onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  } as unknown as MediaQueryList;
  return mql;
}

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: vi.fn((query: string) => createMatchMediaList(query, false))
});

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  useMap: () => ({
    on: vi.fn(),
    off: vi.fn(),
    eachLayer: vi.fn()
  }),
  TileLayer: () => null,
  Polyline: () => null,
  CircleMarker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="map-popup" className={className}>
      {children}
    </div>
  ),
  Tooltip: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-tooltip">{children}</div>
}));
