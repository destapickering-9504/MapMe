import { useEffect, useMemo, useRef, useState } from "react";
import L, { type LatLngExpression } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { OptimizeResponse } from "../domain/routeTypes";
import { linePositionsForRouteIndex, routeOptionByIndex, routeOptionCount } from "../map/routeSelection";
import { useTheme } from "../theme/ThemeContext";
import RouteMapMarkerPopup from "./RouteMapMarkerPopup";

interface Props {
  result: OptimizeResponse | null;
  /** 0 = suggested (fastest); higher indices are alternatives. */
  selectedRouteIndex: number;
  /** Fill the planner map column instead of forcing 100vh. */
  embedded?: boolean;
}

const markerTooltipProps = {
  direction: "top" as const,
  offset: [0, -12] as [number, number],
  opacity: 1,
  interactive: true,
  sticky: true,
  className: "route-map-marker-tooltip"
};

const ROUTE_LINE_LIGHT = { color: "#d97a62", weight: 6, opacity: 0.95, lineCap: "round" as const, lineJoin: "round" as const };
const ROUTE_LINE_DARK = { color: "#7dd3fc", weight: 6, opacity: 0.92, lineCap: "round" as const, lineJoin: "round" as const };
const ROUTE_LINE_DARK_PLANNER = { color: "#7dd3fc", weight: 5, opacity: 0.96, lineCap: "round" as const, lineJoin: "round" as const };
const ROUTE_GLOW_DARK_PLANNER = { color: "#38bdf8", weight: 14, opacity: 0.22, lineCap: "round" as const, lineJoin: "round" as const };

const PLANNER_ORIGIN_ICON = L.divIcon({
  className: "route-planner-leaflet-icon route-planner-leaflet-icon--origin",
  html: '<span class="route-planner-pin-origin" aria-hidden="true">⌂</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const PLANNER_STOP_ICONS = Array.from({ length: 10 }, (_, i) =>
  L.divIcon({
    className: "route-planner-leaflet-icon route-planner-leaflet-icon--stop",
    html: `<span class="route-planner-pin-stop">${i + 1}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })
);
const PIN_ORIGIN_LIGHT = { color: "#059669", fillColor: "#ecfdf5", weight: 3 };
const PIN_ORIGIN_DARK = { color: "#34d399", fillColor: "#0f172a", weight: 2.5 };
const PIN_STOP_LIGHT = { color: "#ea580c", fillColor: "#fff7ed", weight: 2.5 };
const PIN_STOP_DARK = { color: "#fb923c", fillColor: "#0f172a", weight: 2.5 };
const PIN_END_LIGHT = { color: "#6366f1", fillColor: "#ffffff", weight: 3 };
const PIN_END_DARK = { color: "#fb923c", fillColor: "#0f172a", weight: 2.5 };

const TILE_URL_LIGHT = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_URL_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function originMarkerTitle(r: { origin_label?: string | null; origin_query: string }): string {
  return r.origin_label?.trim() || r.origin_query || "Starting location";
}

function firstTileLayer(map: L.Map): L.TileLayer | null {
  let found: L.TileLayer | null = null;
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer && !found) found = layer;
  });
  return found;
}

/**
 * Shows a cover while zooming / re-tiling: zoomstart turns it on; after zoomend we wait for the basemap
 * `load` (or a timeout) so zoom-out does not flash the previous zoom’s tiles. `zoomstart`/`zoomend` in the
 * same tick would batch React updates incorrectly if we only toggled on zoomend, so completion is deferred.
 */
function MapRetilingOverlayControl({ onBusy }: { onBusy: (busy: boolean) => void }) {
  const map = useMap();
  const endGenRef = useRef(0);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearFallback = () => {
      if (fallbackRef.current != null) {
        clearTimeout(fallbackRef.current);
        fallbackRef.current = null;
      }
    };

    const onZoomStart = () => {
      clearFallback();
      onBusy(true);
    };

    const onZoomEnd = () => {
      endGenRef.current += 1;
      const g = endGenRef.current;
      clearFallback();

      const finish = () => {
        if (g !== endGenRef.current) return;
        clearFallback();
        onBusy(false);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (g !== endGenRef.current) return;
          const tile = firstTileLayer(map);
          if (tile) {
            tile.once("load", finish);
            fallbackRef.current = setTimeout(finish, 2200);
          } else {
            finish();
          }
        });
      });
    };

    map.on("zoomstart", onZoomStart);
    map.on("zoomend", onZoomEnd);

    return () => {
      clearFallback();
      map.off("zoomstart", onZoomStart);
      map.off("zoomend", onZoomEnd);
    };
  }, [map, onBusy]);

  return null;
}

export default function RouteMap({ result, selectedRouteIndex, embedded = false }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const showMap = Boolean(result);

  const center: LatLngExpression = useMemo(() => {
    if (result) return [result.origin_lat, result.origin_lng];
    return [37.77, -122.42];
  }, [result]);

  const safeRouteIndex =
    result && selectedRouteIndex >= 0 && selectedRouteIndex < routeOptionCount(result)
      ? selectedRouteIndex
      : 0;

  const positions = useMemo(
    () => (result ? linePositionsForRouteIndex(result, safeRouteIndex) : []),
    [result, safeRouteIndex]
  );

  const activeRoute = result ? routeOptionByIndex(result, safeRouteIndex) : null;

  const routeLine = isDark ? ROUTE_LINE_DARK : ROUTE_LINE_LIGHT;
  const pinOrigin = isDark ? PIN_ORIGIN_DARK : PIN_ORIGIN_LIGHT;
  const pinStop = isDark ? PIN_STOP_DARK : PIN_STOP_LIGHT;
  const pinEnd = isDark ? PIN_END_DARK : PIN_END_LIGHT;
  const tileUrl = isDark ? TILE_URL_DARK : TILE_URL_LIGHT;
  const plannerDecor = embedded && isDark;

  const shellClass = embedded
    ? "route-map-embed map-panel-live relative h-full w-full min-h-0 flex-1 overflow-hidden"
    : "map-panel map-panel-live";

  const [mapRetiling, setMapRetiling] = useState(false);

  if (!showMap) {
    return (
      <div className={embedded ? "flex h-full min-h-[280px] items-center justify-center bg-hm-panel" : "map-panel map-panel-empty"} aria-label="map-view">
        <p className={embedded ? "px-6 text-center text-[14px] font-semibold text-hm-muted" : "map-placeholder-text"}>
          Optimize a route to see the map.
        </p>
      </div>
    );
  }

  return (
    <div className={shellClass} aria-label="map-view">
      {result && routeOptionCount(result) > 0 && !embedded && (
        <div className="route-map-route-badge" aria-live="polite">
          {safeRouteIndex === 0 ? (
            <>
              <span className="route-map-route-badge-label">Route 1</span>
              <span className="route-map-route-badge-hint">suggested (fastest)</span>
            </>
          ) : (
            <>
              <span className="route-map-route-badge-label">Route {safeRouteIndex + 1}</span>
              <span className="route-map-route-badge-hint">alternative</span>
            </>
          )}
        </div>
      )}
      <MapContainer
        key={`${theme}-${isDark ? "d" : "l"}`}
        center={center}
        zoom={12}
        className="route-map-leaflet-mount"
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        attributionControl={false}
        {...(embedded
          ? {
              // Planner: avoid blank frames mid-zoom (new tiles + fade read like the static preview).
              fadeAnimation: false,
              zoomAnimation: true
            }
          : {})}
      >
        <TileLayer
          attribution=""
          url={tileUrl}
          subdomains="abcd"
          maxZoom={19}
          maxNativeZoom={18}
          updateWhenZooming={false}
        />
        <MapRetilingOverlayControl onBusy={setMapRetiling} />
        {result && positions.length >= 2 && plannerDecor && (
          <Polyline
            key={`route-glow-${safeRouteIndex}`}
            positions={positions}
            pathOptions={ROUTE_GLOW_DARK_PLANNER}
          />
        )}
        {result && positions.length >= 2 && (
          <Polyline
            key={`route-line-${safeRouteIndex}`}
            positions={positions}
            pathOptions={plannerDecor ? ROUTE_LINE_DARK_PLANNER : routeLine}
          />
        )}
        {result &&
          (plannerDecor ? (
            <Marker position={[result.origin_lat, result.origin_lng]} icon={PLANNER_ORIGIN_ICON}>
              <Tooltip {...markerTooltipProps} offset={[0, -14]}>
                <RouteMapMarkerPopup
                  title={originMarkerTitle(result)}
                  lat={result.origin_lat}
                  lng={result.origin_lng}
                  imageAlt={`Map preview near ${result.origin_query}`}
                  fields={[
                    { label: "Address", value: result.origin_address },
                    { label: "You entered", value: result.origin_query || "—" }
                  ]}
                />
              </Tooltip>
            </Marker>
          ) : (
            <CircleMarker
              center={[result.origin_lat, result.origin_lng]}
              radius={10}
              pathOptions={pinOrigin}
            >
              <Tooltip {...markerTooltipProps} offset={[0, -14]}>
                <RouteMapMarkerPopup
                  title={originMarkerTitle(result)}
                  lat={result.origin_lat}
                  lng={result.origin_lng}
                  imageAlt={`Map preview near ${result.origin_query}`}
                  fields={[
                    { label: "Address", value: result.origin_address },
                    { label: "You entered", value: result.origin_query || "—" }
                  ]}
                />
              </Tooltip>
            </CircleMarker>
          ))}
        {result &&
          activeRoute &&
          activeRoute.ordered_stops.map((stop, i) => {
            const n = activeRoute.ordered_stops.length;
            return plannerDecor ? (
              <Marker
                key={`${stop.query}-${i}-${stop.lat}-${safeRouteIndex}`}
                position={[stop.lat, stop.lng]}
                icon={PLANNER_STOP_ICONS[i] ?? PLANNER_STOP_ICONS[0]}
              >
                <Tooltip {...markerTooltipProps}>
                  <RouteMapMarkerPopup
                    title={`${i + 1}. ${stop.query}`}
                    lat={stop.lat}
                    lng={stop.lng}
                    imageAlt={`Map preview near ${stop.query}`}
                    fields={[
                      { label: "Address", value: stop.address },
                      { label: "Stop on route", value: `${i + 1} of ${n}` }
                    ]}
                  />
                </Tooltip>
              </Marker>
            ) : (
              <CircleMarker
                key={`${stop.query}-${i}-${stop.lat}-${safeRouteIndex}`}
                center={[stop.lat, stop.lng]}
                radius={9}
                pathOptions={pinStop}
              >
                <Tooltip {...markerTooltipProps}>
                  <RouteMapMarkerPopup
                    title={`${i + 1}. ${stop.query}`}
                    lat={stop.lat}
                    lng={stop.lng}
                    imageAlt={`Map preview near ${stop.query}`}
                    fields={[
                      { label: "Address", value: stop.address },
                      { label: "Stop on route", value: `${i + 1} of ${n}` }
                    ]}
                  />
                </Tooltip>
              </CircleMarker>
            );
          })}
        {result &&
          result.destination_lat != null &&
          result.destination_lng != null &&
          !Number.isNaN(result.destination_lat) &&
          !Number.isNaN(result.destination_lng) && (
            <CircleMarker
              center={[result.destination_lat, result.destination_lng]}
              radius={10}
              pathOptions={pinEnd}
            >
              <Tooltip {...markerTooltipProps} offset={[0, -14]}>
                <RouteMapMarkerPopup
                  title={result.destination_query || "End location"}
                  lat={result.destination_lat}
                  lng={result.destination_lng}
                  imageAlt={`Map preview near ${result.destination_query ?? "destination"}`}
                  fields={[
                    { label: "Address", value: result.destination_address ?? "—" },
                    { label: "You entered", value: result.destination_query ?? "—" }
                  ]}
                />
              </Tooltip>
            </CircleMarker>
          )}
      </MapContainer>
      {mapRetiling ? (
        <div
          className="route-map-retiling-cover"
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading map tiles"
        >
          <div className="route-map-retiling-spinner" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}
