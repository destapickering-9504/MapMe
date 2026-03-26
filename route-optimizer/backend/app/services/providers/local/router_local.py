from __future__ import annotations

from app.domain.interfaces import RoutingProvider


class LocalRoutingProvider(RoutingProvider):
    async def matrix_minutes(self, points: list[tuple[float, float]]) -> list[list[float]]:
        raise NotImplementedError("Local routing provider not implemented yet.")

    async def route_line_geojson(
        self, waypoints_lat_lng: list[tuple[float, float]]
    ) -> dict | None:
        raise NotImplementedError("Local routing provider not implemented yet.")
