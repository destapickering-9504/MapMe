from __future__ import annotations

import httpx

from app.core.config import settings
from app.domain.geo import haversine_m
from app.domain.interfaces import GeocoderProvider
from app.domain.places import ResolvedLocation


def _places_from_nominatim_payload(payload: list) -> list[ResolvedLocation]:
    items: list[ResolvedLocation] = []
    for row in payload:
        if not isinstance(row, dict):
            continue
        lat_raw = row.get("lat")
        lon_raw = row.get("lon")
        if lat_raw is None or lon_raw is None:
            continue
        try:
            lat = float(lat_raw)
            lng = float(lon_raw)
        except (TypeError, ValueError):
            continue
        addr_raw = row.get("display_name")
        address = addr_raw if isinstance(addr_raw, str) and addr_raw.strip() else f"{lat}, {lng}"
        items.append(ResolvedLocation(lat=lat, lng=lng, display_address=address))
    return items


def _viewbox_around_origin(lat: float, lng: float, span_deg: float) -> str:
    """Nominatim viewbox: min_lon, max_lat, max_lon, min_lat (boost order when bounded=0)."""
    min_lon = max(-180.0, lng - span_deg)
    max_lon = min(180.0, lng + span_deg)
    min_lat = max(-85.0, lat - span_deg)
    max_lat = min(85.0, lat + span_deg)
    return f"{min_lon},{max_lat},{max_lon},{min_lat}"


def _viewbox_covering_anchors(
    primary: tuple[float, float],
    stop_anchor: tuple[float, float] | None,
    span_deg: float,
) -> str:
    """Viewbox that includes the trip anchor and optional stop-specific anchor."""
    lats = [primary[0]]
    lngs = [primary[1]]
    if stop_anchor is not None:
        lats.append(stop_anchor[0])
        lngs.append(stop_anchor[1])
    min_lat = max(-85.0, min(lats) - span_deg)
    max_lat = min(85.0, max(lats) + span_deg)
    min_lon = max(-180.0, min(lngs) - span_deg)
    max_lon = min(180.0, max(lngs) + span_deg)
    return f"{min_lon},{max_lat},{max_lon},{min_lat}"


def _sort_by_distance_to_origin(
    places: list[ResolvedLocation], origin: tuple[float, float]
) -> list[ResolvedLocation]:
    olat, olng = origin
    return sorted(places, key=lambda p: haversine_m(olat, olng, p.lat, p.lng))


def _sort_by_distance_to_trip_and_stop_anchor(
    places: list[ResolvedLocation],
    trip_anchor: tuple[float, float],
    stop_anchor: tuple[float, float],
) -> list[ResolvedLocation]:
    """Prefer results that are not far from either the trip anchor or the stop address anchor."""
    tlat, tlng = trip_anchor
    slat, slng = stop_anchor

    def key(p: ResolvedLocation) -> float:
        d_trip = haversine_m(tlat, tlng, p.lat, p.lng)
        d_stop = haversine_m(slat, slng, p.lat, p.lng)
        return d_trip + d_stop

    return sorted(places, key=key)


class PublicGeocoderProvider(GeocoderProvider):
    async def geocode_place(self, place_query: str) -> ResolvedLocation | None:
        params = {
            "q": place_query,
            "format": "jsonv2",
            "limit": "1",
        }
        headers = {
            "User-Agent": settings.public_user_agent,
            "Accept": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=settings.public_request_timeout_seconds) as client:
                response = await client.get(settings.public_geocode_url, params=params, headers=headers)
                response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError):
            return None

        if not isinstance(payload, list):
            return None
        places = _places_from_nominatim_payload(payload)
        return places[0] if places else None

    async def candidates_for_store(
        self,
        store_query: str,
        origin: tuple[float, float],
        *,
        stop_anchor: tuple[float, float] | None = None,
    ) -> list[ResolvedLocation]:
        lat, lng = origin
        span = settings.public_geocoder_viewbox_degrees
        viewbox = (
            _viewbox_covering_anchors(origin, stop_anchor, span)
            if stop_anchor is not None
            else _viewbox_around_origin(lat, lng, span)
        )
        limit = min(max(settings.public_geocoder_limit, 1), 40)
        params = {
            "q": store_query,
            "format": "jsonv2",
            "limit": str(limit),
            # Nominatim does not use lat/lon on /search; viewbox boosts same-region matches.
            "viewbox": viewbox,
            "bounded": "0",
        }
        headers = {
            "User-Agent": settings.public_user_agent,
            "Accept": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=settings.public_request_timeout_seconds) as client:
                response = await client.get(settings.public_geocode_url, params=params, headers=headers)
                response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError):
            return []

        if not isinstance(payload, list):
            return []
        places = _places_from_nominatim_payload(payload)
        if stop_anchor is not None:
            return _sort_by_distance_to_trip_and_stop_anchor(places, origin, stop_anchor)
        return _sort_by_distance_to_origin(places, origin)
