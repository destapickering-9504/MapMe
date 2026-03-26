from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.places import ResolvedLocation


class GeocoderProvider(ABC):
    @abstractmethod
    async def geocode_place(self, place_query: str) -> ResolvedLocation | None:
        raise NotImplementedError

    @abstractmethod
    async def candidates_for_store(
        self, store_query: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        raise NotImplementedError

    @abstractmethod
    async def search_places_near(
        self, search_term: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        """POI / place search restricted to a map box around ``origin`` (provider-specific)."""
        raise NotImplementedError


class RoutingProvider(ABC):
    @abstractmethod
    async def matrix_minutes(self, points: list[tuple[float, float]]) -> list[list[float]]:
        raise NotImplementedError

    @abstractmethod
    async def route_line_geojson(
        self, waypoints_lat_lng: list[tuple[float, float]]
    ) -> dict | None:
        """Return GeoJSON LineString with coordinates [lng, lat] pairs, or None if unavailable."""
        raise NotImplementedError
