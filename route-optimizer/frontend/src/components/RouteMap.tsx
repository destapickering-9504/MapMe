import { useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OptimizeResponse } from "../domain/routeTypes";
import { linePositionsForRouteIndex, routeOptionByIndex, routeOptionCount } from "../map/routeSelection";
import RouteMapMarkerPopup from "./RouteMapMarkerPopup";

interface Props {
  result: OptimizeResponse | null;
  /** 0 = suggested (fastest); higher indices are alternatives. */
  selectedRouteIndex: number;
}

const markerTooltipProps = {
  direction: "top" as const,
  offset: [0, -12] as [number, number],
  opacity: 1,
  interactive: true,
  sticky: true,
  className: "route-map-marker-tooltip"
};

/** Matches App.css --theme-salmon / --theme-mint / --theme-end (Leaflet SVG ignores CSS vars). */
const ROUTE_LINE = { color: "#d97a62", weight: 6, opacity: 0.95, lineCap: "round" as const, lineJoin: "round" as const };
const PIN_ORIGIN = { color: "#FEA993", fillColor: "#ffffff", weight: 3 };
const PIN_STOP = { color: "#4cbf9f", fillColor: "#ffffff", weight: 2.5 };
const PIN_END = { color: "#6366f1", fillColor: "#ffffff", weight: 3 };

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions/">CARTO</a>';
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export default function RouteMap({ result, selectedRouteIndex }: Props) {
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

  if (!showMap) {
    return (
      <div className="map-panel map-panel-empty" aria-label="map-view">
        <p className="map-placeholder-text">Optimize a route to see the map.</p>
      </div>
    );
  }

  return (
    <div className="map-panel map-panel-live" aria-label="map-view">
      {result && routeOptionCount(result) > 0 && (
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
        center={center}
        zoom={12}
        className="route-map-leaflet-mount"
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION}
          url={TILE_URL}
          subdomains="abcd"
          maxZoom={19}
          maxNativeZoom={18}
        />
        {result && positions.length >= 2 && (
          <Polyline key={`route-line-${safeRouteIndex}`} positions={positions} pathOptions={ROUTE_LINE} />
        )}
        {result && (
          <CircleMarker
            center={[result.origin_lat, result.origin_lng]}
            radius={10}
            pathOptions={PIN_ORIGIN}
          >
            <Tooltip {...markerTooltipProps} offset={[0, -14]}>
              <RouteMapMarkerPopup
                title={result.origin_query || "Starting location"}
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
        )}
        {result &&
          activeRoute &&
          activeRoute.ordered_stops.map((stop, i) => {
            const n = activeRoute.ordered_stops.length;
            return (
              <CircleMarker
                key={`${stop.query}-${i}-${stop.lat}-${safeRouteIndex}`}
                center={[stop.lat, stop.lng]}
                radius={9}
                pathOptions={PIN_STOP}
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
              pathOptions={PIN_END}
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
    </div>
  );
}
