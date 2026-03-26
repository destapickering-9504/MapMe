import { useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { NearbyPlace, NearbyResponse, OptimizeResponse } from "../domain/routeTypes";
import { NEARBY_PIN_COLORS } from "../map/nearbyPinColors";
import { linePositionsForRouteIndex, routeOptionByIndex, routeOptionCount } from "../map/routeSelection";
import RouteMapMarkerPopup from "./RouteMapMarkerPopup";

interface Props {
  result: OptimizeResponse | null;
  nearby: NearbyResponse | null;
  /** 0 = suggested (fastest); higher indices are alternatives. */
  selectedRouteIndex: number;
}

function formatDistanceM(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

const markerTooltipProps = {
  direction: "top" as const,
  offset: [0, -12] as [number, number],
  opacity: 1,
  interactive: true,
  sticky: true,
  className: "route-map-marker-tooltip"
};

export default function RouteMap({ result, nearby, selectedRouteIndex }: Props) {
  const showMap = Boolean(result || nearby);

  const center: LatLngExpression = useMemo(() => {
    if (result) return [result.origin_lat, result.origin_lng];
    if (nearby) return [nearby.origin_lat, nearby.origin_lng];
    return [37.77, -122.42];
  }, [result, nearby]);

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
        <p className="map-placeholder-text">
          Optimize a route (Plan your Route) or search nearby (Stores Near Me) to see the map.
        </p>
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
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {result && positions.length >= 2 && (
          <Polyline
            key={`route-line-${safeRouteIndex}`}
            positions={positions}
            pathOptions={{ color: "var(--theme-salmon)", weight: 5, opacity: 0.85 }}
          />
        )}
        {result && (
          <CircleMarker
            center={[result.origin_lat, result.origin_lng]}
            radius={10}
            pathOptions={{ color: "var(--theme-salmon)", fillColor: "var(--theme-white)", weight: 3 }}
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
        {!result && nearby && (
          <CircleMarker
            center={[nearby.origin_lat, nearby.origin_lng]}
            radius={10}
            pathOptions={{ color: "var(--theme-salmon)", fillColor: "var(--theme-white)", weight: 3 }}
          >
            <Tooltip {...markerTooltipProps} offset={[0, -14]}>
              <RouteMapMarkerPopup
                title={nearby.origin_query || "Your location"}
                lat={nearby.origin_lat}
                lng={nearby.origin_lng}
                imageAlt={`Map preview near ${nearby.origin_query}`}
                fields={[
                  { label: "Address", value: nearby.origin_address },
                  { label: "Searching for", value: nearby.search }
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
                pathOptions={{ color: "var(--theme-mint)", fillColor: "var(--theme-white)", weight: 2 }}
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
              pathOptions={{ color: "var(--theme-end)", fillColor: "var(--theme-white)", weight: 3 }}
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
        {nearby &&
          nearby.places.map((place: NearbyPlace, i: number) => {
            const stroke = NEARBY_PIN_COLORS[i % NEARBY_PIN_COLORS.length];
            return (
              <CircleMarker
                key={`nearby-${place.lat}-${place.lng}-${i}`}
                center={[place.lat, place.lng]}
                radius={9}
                pathOptions={{ color: stroke, fillColor: "var(--theme-white)", weight: 3 }}
              >
                <Tooltip {...markerTooltipProps}>
                  <RouteMapMarkerPopup
                    title={place.name}
                    lat={place.lat}
                    lng={place.lng}
                    imageAlt={`Map preview near ${place.name}`}
                    fields={[
                      { label: "Address", value: place.address },
                      { label: "Distance", value: formatDistanceM(place.distance_m) },
                      { label: "Search", value: nearby.search }
                    ]}
                  />
                </Tooltip>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
