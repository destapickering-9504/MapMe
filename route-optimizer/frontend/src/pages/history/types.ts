import type { OptimizeResponse } from "../../domain/routeTypes";

/** How the route was optimized (UI filter; API rows default to driving until persisted). */
export type RouteTransportMode = "driving" | "walking" | "transit";

export type StartIconKind = "home" | "work" | "pin";

export type TransitThumbKind = "bus" | "train";

export interface HistoryRouteViewModel {
  id: string;
  title: string;
  summaryLine: string;
  metaLine: string;
  startLabel: string;
  startIcon: StartIconKind;
  isFavorite: boolean;
  routeType: RouteTransportMode;
  /** For transit routes only; omitted means bus-style icon. */
  transitThumb?: TransitThumbKind;
  createdAt: string;
  payload: OptimizeResponse;
}
