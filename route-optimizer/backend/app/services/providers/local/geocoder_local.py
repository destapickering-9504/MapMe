from __future__ import annotations

from app.domain.interfaces import GeocoderProvider
from app.domain.places import ResolvedLocation


class LocalGeocoderProvider(GeocoderProvider):
    async def geocode_place(self, place_query: str) -> ResolvedLocation | None:
        raise NotImplementedError("Local geocoder provider not implemented yet.")

    async def candidates_for_store(
        self, store_query: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        raise NotImplementedError("Local geocoder provider not implemented yet.")

    async def search_places_near(
        self, search_term: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        raise NotImplementedError("Local geocoder provider not implemented yet.")
