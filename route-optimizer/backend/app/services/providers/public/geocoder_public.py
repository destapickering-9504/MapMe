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


def _sort_by_distance_to_origin(
    places: list[ResolvedLocation], origin: tuple[float, float]
) -> list[ResolvedLocation]:
    olat, olng = origin
    return sorted(places, key=lambda p: haversine_m(olat, olng, p.lat, p.lng))


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
        self, store_query: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        lat, lng = origin
        limit = min(max(settings.public_geocoder_limit, 1), 40)
        params = {
            "q": store_query,
            "format": "jsonv2",
            "limit": str(limit),
            # Nominatim does not use lat/lon on /search; viewbox boosts same-region matches.
            "viewbox": _viewbox_around_origin(lat, lng, settings.public_geocoder_viewbox_degrees),
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
        return _sort_by_distance_to_origin(places, origin)

    async def search_places_near(
        self, search_term: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        """Bounded Nominatim search inside a box around the user (same area, many hits)."""
        lat, lng = origin
        span = max(settings.public_nearby_viewbox_span_deg, 0.01)
        limit = min(max(settings.public_nearby_max_results, 1), 40)
        params = {
            "q": search_term.strip(),
            "format": "jsonv2",
            "limit": str(limit),
            "viewbox": _viewbox_around_origin(lat, lng, span),
            "bounded": "1",
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
        return _places_from_nominatim_payload(payload)
