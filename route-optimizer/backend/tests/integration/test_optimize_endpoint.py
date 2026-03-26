from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.api.optimize as optimize_module
from app.domain.places import ResolvedLocation
from app.main import app

client = TestClient(app)


class _FakeGeocoder:
    async def geocode_place(self, place_query: str) -> ResolvedLocation | None:
        return ResolvedLocation(
            lat=37.7749,
            lng=-122.4194,
            display_address="94102, San Francisco, California, USA",
        )

    async def candidates_for_store(
        self, store_query: str, origin: tuple[float, float]
    ) -> list[ResolvedLocation]:
        return [
            ResolvedLocation(
                lat=origin[0] + 0.01,
                lng=origin[1] + 0.01,
                display_address=f"{store_query}, 100 Market St, San Francisco, CA, USA",
            )
        ]


class _FakeRouter:
    async def matrix_minutes(self, points: list[tuple[float, float]]) -> list[list[float]]:
        n = len(points)
        return [[0.0 if i == j else 5.0 for j in range(n)] for i in range(n)]

    async def route_line_geojson(
        self, waypoints_lat_lng: list[tuple[float, float]]
    ) -> dict[str, list[list[float]]]:
        return {
            "type": "LineString",
            "coordinates": [[-122.42, 37.78], [-122.43, 37.79]],
        }


@pytest.fixture(autouse=True)
def fake_providers(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        optimize_module,
        "build_providers",
        lambda: (_FakeGeocoder(), _FakeRouter()),
    )


def test_optimize_endpoint_success() -> None:
    payload = {
        "origin_place": "94102",
        "stores": ["Target", "Whole Foods", "Trader Joe's"],
        "trip_mode": "round_trip",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["origin_query"] == "94102"
    assert "San Francisco" in body["origin_address"]
    assert body["permutations_considered"] == 6
    assert len(body["stops_resolved"]) == 3
    assert all("address" in s for s in body["stops_resolved"])
    assert "best_route" in body
    assert len(body["best_route"]["ordered_stops"]) == 3
    assert body["best_route"]["ordered_stores"]
    assert body["trip_mode"] == "round_trip"
    assert body["best_route_geojson"] is not None
    assert body["best_route_geojson"]["type"] == "LineString"
    assert len(body["route_geojson_options"]) >= 1
    assert body["route_geojson_options"][0] is not None


def test_optimize_prefers_petco_near_other_stop_even_if_petco_first_line(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Two-pass resolution: Petco line before Whole Foods still snaps to same-lot Petco."""

    class _Geo(_FakeGeocoder):
        async def candidates_for_store(
            self, store_query: str, origin: tuple[float, float]
        ) -> list[ResolvedLocation]:
            q = store_query.lower()
            if "whole" in q:
                return [
                    ResolvedLocation(
                        lat=47.637,
                        lng=-122.377,
                        display_address="Whole Foods, 2001 15th Ave W, Seattle, WA",
                    )
                ]
            if "petco" in q:
                return [
                    ResolvedLocation(
                        lat=47.8,
                        lng=-122.2,
                        display_address="Petco, Holman Rd, Seattle, WA",
                    ),
                    ResolvedLocation(
                        lat=47.63708,
                        lng=-122.37708,
                        display_address="Petco, 2001 15th Ave W, Seattle, WA",
                    ),
                ]
            return await super().candidates_for_store(store_query, origin)

    monkeypatch.setattr(
        optimize_module,
        "build_providers",
        lambda: (_Geo(), _FakeRouter()),
    )
    payload = {
        "origin_place": "94102",
        "stores": ["Petco", "Whole Foods"],
        "trip_mode": "round_trip",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    body = response.json()
    petco_resolved = next(s for s in body["stops_resolved"] if "petco" in s["query"].lower())
    assert "15th" in petco_resolved["address"] or "2001" in petco_resolved["address"]


def test_optimize_validation_max_stores() -> None:
    payload = {
        "origin_place": "San Francisco, CA",
        "stores": [str(i) for i in range(11)],
        "trip_mode": "round_trip",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 422


def test_optimize_geocode_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    class _NoGeocode:
        async def geocode_place(self, place_query: str) -> ResolvedLocation | None:
            return None

        async def candidates_for_store(
            self, store_query: str, origin: tuple[float, float]
        ) -> list[ResolvedLocation]:
            return []

    monkeypatch.setattr(
        optimize_module,
        "build_providers",
        lambda: (_NoGeocode(), _FakeRouter()),
    )
    payload = {
        "origin_place": "zzzznonexistent99999",
        "stores": ["A", "B"],
        "trip_mode": "round_trip",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 400
    assert "location" in response.json()["detail"].lower()


def test_optimize_with_destination_place() -> None:
    payload = {
        "origin_place": "94102",
        "stores": ["Target", "Whole Foods"],
        "trip_mode": "one_way",
        "destination_place": "Oakland, CA",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["permutations_considered"] == 2
    assert body["destination_query"] == "Oakland, CA"
    assert body["destination_address"]
    assert body["destination_lat"] is not None
    assert body["destination_lng"] is not None
    assert "between start and end" in body["explanation"]


def test_optimize_one_stop_with_destination_ok() -> None:
    payload = {
        "origin_place": "94102",
        "stores": ["Target"],
        "trip_mode": "one_way",
        "destination_place": "SFO",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    assert response.json()["permutations_considered"] == 1


def test_optimize_validation_one_store_without_destination() -> None:
    payload = {
        "origin_place": "San Francisco, CA",
        "stores": ["Target"],
        "trip_mode": "round_trip",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 422


def test_optimize_destination_geocode_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    call_count = {"n": 0}

    class _Geo(_FakeGeocoder):
        async def geocode_place(self, place_query: str) -> ResolvedLocation | None:
            call_count["n"] += 1
            if call_count["n"] == 1:
                return await super().geocode_place(place_query)
            return None

    monkeypatch.setattr(
        optimize_module,
        "build_providers",
        lambda: (_Geo(), _FakeRouter()),
    )
    payload = {
        "origin_place": "94102",
        "stores": ["Target", "Whole Foods"],
        "trip_mode": "round_trip",
        "destination_place": "zzzznonexistent99999",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 400
    assert "end location" in response.json()["detail"].lower()


def test_optimize_store_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    class _NoStores(_FakeGeocoder):
        async def candidates_for_store(
            self, store_query: str, origin: tuple[float, float]
        ) -> list[ResolvedLocation]:
            return []

    monkeypatch.setattr(
        optimize_module,
        "build_providers",
        lambda: (_NoStores(), _FakeRouter()),
    )
    payload = {
        "origin_place": "94102",
        "stores": ["Target", "Whole Foods"],
        "trip_mode": "round_trip",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 400
    assert "Target" in response.json()["detail"] or "store" in response.json()["detail"].lower()
