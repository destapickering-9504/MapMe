import React from "react";
import { vi } from "vitest";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Polyline: () => null,
  CircleMarker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="map-popup" className={className}>
      {children}
    </div>
  ),
  Tooltip: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-tooltip">{children}</div>
}));
