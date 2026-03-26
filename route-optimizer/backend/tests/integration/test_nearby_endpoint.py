from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.api.nearby as nearby_module
from app.domain.places import ResolvedLocation
from app.main import app

client = TestClient(app)


class _FakeGeocoderNearby:
    async def geocode_place(self, place_query: str) -> ResolvedLocation | None:
        return ResolvedLocation(
            lat=47.6062,
            lng=-122.3321,
            display_address="Seattle, WA, USA",
        )

    async def candidates_for_store(
        self, store_query: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        return []

    async def search_places_near(
        self, search_term: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        return [
            ResolvedLocation(
                lat=origin[0] + 0.02,
                lng=origin[1] + 0.02,
                display_address="First Mart, 1 Pike St, Seattle, WA, USA",
            ),
            ResolvedLocation(
                lat=origin[0] + 0.04,
                lng=origin[1] + 0.03,
                display_address="Second Mart, 2 Pike St, Seattle, WA, USA",
            ),
        ]


class _FakeRouter:
    async def matrix_minutes(self, points: list[tuple[float, float]]) -> list[list[float]]:
        return [[0.0]]

    async def route_line_geojson(
        self, waypoints_lat_lng: list[tuple[float, float]]
    ) -> dict | None:
        return None


@pytest.fixture(autouse=True)
def fake_nearby_providers(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        nearby_module,
        "build_providers",
        lambda: (_FakeGeocoderNearby(), _FakeRouter()),
    )


def test_nearby_endpoint_returns_places() -> None:
    response = client.post(
        "/api/nearby",
        json={"origin_place": "Seattle, WA", "search": "grocery"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["search"] == "grocery"
    assert "Seattle" in body["origin_address"]
    assert len(body["places"]) == 2
    assert body["places"][0]["name"]
    assert body["places"][0]["distance_m"] >= 0


def test_nearby_validation_empty_search() -> None:
    response = client.post(
        "/api/nearby",
        json={"origin_place": "Seattle", "search": "   "},
    )
    assert response.status_code == 422
