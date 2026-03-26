from __future__ import annotations

import httpx

from app.core.config import settings
from app.domain.geo import haversine_m
from app.domain.interfaces import RoutingProvider

# OSRM uses null when it cannot route (often duplicate / nearly identical coordinates).
_OSRM_NULL_MINUTES = 9999.0
# If straight-line distance is still small, treat as same complex / parking-lot hop.
_NEARBY_NULL_REPAIR_METERS = 750.0


def _repair_nearby_null_matrix_legs(
    points: list[tuple[float, float]], matrix: list[list[float]]
) -> None:
    """Replace OSRM null legs with a short driving estimate when pins are physically close.

    Duplicate or nearly identical coordinates yield ``null`` durations; treating those as
    "very expensive" makes the optimizer avoid visiting adjacent storefronts back-to-back.
    """
    n = len(points)
    for i in range(n):
        for j in range(n):
            if i == j:
                matrix[i][j] = 0.0
                continue
            if matrix[i][j] < _OSRM_NULL_MINUTES - 1:
                continue
            la, ln = points[i]
            lb, ln2 = points[j]
            d_m = haversine_m(la, ln, lb, ln2)
            if d_m <= _NEARBY_NULL_REPAIR_METERS:
                matrix[i][j] = max(0.2, min(10.0, (d_m / 1000.0) * 5.0))


class PublicRoutingProvider(RoutingProvider):
    async def matrix_minutes(self, points: list[tuple[float, float]]) -> list[list[float]]:
        if not points:
            return []

        coordinates = ";".join(f"{lng},{lat}" for lat, lng in points)
        url = f"{settings.public_routing_url}/{coordinates}"
        params = {"annotations": "duration"}
        headers = {
            "User-Agent": settings.public_user_agent,
            "Accept": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=settings.public_request_timeout_seconds) as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
            payload = response.json()
            durations = payload.get("durations")
            if not isinstance(durations, list):
                return self._fallback_matrix(points)
            matrix: list[list[float]] = []
            for row in durations:
                if not isinstance(row, list):
                    return self._fallback_matrix(points)
                matrix_row: list[float] = []
                for cell in row:
                    if cell is None:
                        matrix_row.append(_OSRM_NULL_MINUTES)
                    else:
                        matrix_row.append(float(cell) / 60.0)
                matrix.append(matrix_row)
            _repair_nearby_null_matrix_legs(points, matrix)
            return matrix
        except (httpx.HTTPError, ValueError, TypeError):
            return self._fallback_matrix(points)

    async def route_line_geojson(
        self, waypoints_lat_lng: list[tuple[float, float]]
    ) -> dict | None:
        if len(waypoints_lat_lng) < 2:
            return None

        coordinates = ";".join(f"{lng},{lat}" for lat, lng in waypoints_lat_lng)
        url = f"{settings.public_route_url}/{coordinates}"
        params = {"overview": "full", "geometries": "geojson"}
        headers = {
            "User-Agent": settings.public_user_agent,
            "Accept": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=settings.public_request_timeout_seconds) as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError, TypeError):
            return None

        routes = payload.get("routes")
        if not isinstance(routes, list) or not routes:
            return None
        first = routes[0]
        if not isinstance(first, dict):
            return None
        geometry = first.get("geometry")
        if not isinstance(geometry, dict):
            return None
        if geometry.get("type") != "LineString":
            return None
        coords = geometry.get("coordinates")
        if not isinstance(coords, list) or not coords:
            return None
        return {"type": "LineString", "coordinates": coords}

    @staticmethod
    def _fallback_matrix(points: list[tuple[float, float]]) -> list[list[float]]:
        # Lightweight fallback that approximates driving time in minutes.
        size = len(points)
        matrix: list[list[float]] = []
        for i, (lat_i, lng_i) in enumerate(points):
            row: list[float] = []
            for j, (lat_j, lng_j) in enumerate(points):
                if i == j:
                    row.append(0.0)
                    continue
                distance = abs(lat_i - lat_j) + abs(lng_i - lng_j)
                row.append(max(1.0, distance * 120.0))
            matrix.append(row)
        return matrix
