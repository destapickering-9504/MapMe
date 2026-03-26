import pytest

import app.services.providers.public.geocoder_public as geocoder_module
from app.domain.geo import haversine_m
import app.services.providers.public.router_public as router_module
from app.services.providers.local.geocoder_local import LocalGeocoderProvider
from app.services.providers.local.router_local import LocalRoutingProvider
from app.services.providers.public.geocoder_public import PublicGeocoderProvider
from app.services.providers.public.router_public import PublicRoutingProvider


@pytest.mark.asyncio
async def test_public_geocoder_returns_candidate(monkeypatch):
    captured: dict = {}

    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> list[dict[str, str]]:
            return [
                {
                    "lat": "37.1",
                    "lon": "-122.1",
                    "display_name": "Target, Example St, CA, USA",
                }
            ]

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            captured["params"] = kwargs.get("params")
            return DummyResponse()

    monkeypatch.setattr(geocoder_module.httpx, "AsyncClient", DummyClient)
    provider = PublicGeocoderProvider()
    items = await provider.candidates_for_store("Target", (37.0, -122.0))
    assert len(items) == 1
    assert items[0].lat == 37.1
    assert "Target" in items[0].display_address
    assert captured.get("params", {}).get("viewbox")
    assert captured["params"].get("bounded") == "0"
    assert "lat" not in captured["params"]


@pytest.mark.asyncio
async def test_public_geocoder_candidates_ordered_by_distance_to_origin(monkeypatch):
    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> list[dict[str, str]]:
            return [
                {"lat": "40.0", "lon": "-74.0", "display_name": "Far from origin"},
                {"lat": "37.05", "lon": "-122.05", "display_name": "Close to origin"},
            ]

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            return DummyResponse()

    monkeypatch.setattr(geocoder_module.httpx, "AsyncClient", DummyClient)
    provider = PublicGeocoderProvider()
    items = await provider.candidates_for_store("place", (37.0, -122.0))
    assert len(items) == 2
    assert items[0].display_address == "Close to origin"
    assert items[1].display_address == "Far from origin"


@pytest.mark.asyncio
async def test_public_geocoder_candidates_ordered_by_dual_anchors(monkeypatch):
    """With stop_anchor, rank by sum of haversine distances to trip and stop anchors."""

    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> list[dict[str, str]]:
            return [
                {"lat": "37.0", "lon": "-122.0", "display_name": "On trip anchor only"},
                {"lat": "37.05", "lon": "-122.05", "display_name": "Between both anchors"},
                {"lat": "40.0", "lon": "-74.0", "display_name": "Far from both"},
            ]

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            return DummyResponse()

    monkeypatch.setattr(geocoder_module.httpx, "AsyncClient", DummyClient)
    provider = PublicGeocoderProvider()
    trip = (37.0, -122.0)
    stop = (37.1, -122.1)
    items = await provider.candidates_for_store("place", trip, stop_anchor=stop)
    assert len(items) == 3

    def sum_anchor_d(p) -> float:
        return haversine_m(trip[0], trip[1], p.lat, p.lng) + haversine_m(
            stop[0], stop[1], p.lat, p.lng
        )

    sums = [sum_anchor_d(p) for p in items]
    assert sums == sorted(sums)
    assert items[-1].display_address == "Far from both"


@pytest.mark.asyncio
async def test_public_geocoder_geocode_place(monkeypatch):
    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> list[dict[str, str]]:
            return [
                {
                    "lat": "40.7",
                    "lon": "-74.0",
                    "display_name": "New York, NY, USA",
                }
            ]

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            return DummyResponse()

    monkeypatch.setattr(geocoder_module.httpx, "AsyncClient", DummyClient)
    provider = PublicGeocoderProvider()
    place = await provider.geocode_place("10001")
    assert place is not None
    assert place.lat == 40.7
    assert place.lng == -74.0
    assert "New York" in place.display_address


@pytest.mark.asyncio
async def test_public_router_repairs_null_between_nearby_duplicate_pins(monkeypatch):
    """OSRM returns null between duplicated coordinates; repair so the optimizer can visit both."""
    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self):
            return {
                "durations": [
                    [0, None, None],
                    [None, 0, None],
                    [None, None, 0],
                ]
            }

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            return DummyResponse()

    monkeypatch.setattr(router_module.httpx, "AsyncClient", DummyClient)
    provider = PublicRoutingProvider()
    # origin plus two stops at the same geocode (same strip / bad duplicate snap)
    pts = [(47.6, -122.35), (47.61, -122.36), (47.61, -122.36)]
    matrix = await provider.matrix_minutes(pts)
    assert matrix[1][2] < 50
    assert matrix[2][1] < 50
    assert matrix[0][1] >= router_module._OSRM_NULL_MINUTES - 1


@pytest.mark.asyncio
async def test_public_router_matrix_size(monkeypatch):
    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[list[float]]]:
            return {"durations": [[0, 600], [600, 0]]}

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            return DummyResponse()

    monkeypatch.setattr(router_module.httpx, "AsyncClient", DummyClient)
    provider = PublicRoutingProvider()
    matrix = await provider.matrix_minutes([(1.0, 1.0), (2.0, 2.0)])
    assert len(matrix) == 2
    assert matrix[0][1] == 10.0


@pytest.mark.asyncio
async def test_public_router_route_line_geojson(monkeypatch):
    class DummyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {
                "routes": [
                    {
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [[-1.0, 2.0], [-1.1, 2.1]],
                        }
                    }
                ]
            }

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            return DummyResponse()

    monkeypatch.setattr(router_module.httpx, "AsyncClient", DummyClient)
    provider = PublicRoutingProvider()
    geo = await provider.route_line_geojson([(2.0, -1.0), (2.1, -1.1)])
    assert geo is not None
    assert geo["type"] == "LineString"
    assert geo["coordinates"] == [[-1.0, 2.0], [-1.1, 2.1]]


@pytest.mark.asyncio
async def test_public_router_falls_back_on_error(monkeypatch):
    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, *args, **kwargs):
            raise router_module.httpx.ConnectError("boom")

    monkeypatch.setattr(router_module.httpx, "AsyncClient", DummyClient)
    provider = PublicRoutingProvider()
    matrix = await provider.matrix_minutes([(1.0, 1.0), (1.1, 1.1)])
    assert len(matrix) == 2
    assert matrix[0][0] == 0.0


@pytest.mark.asyncio
async def test_local_providers_not_implemented():
    geocoder = LocalGeocoderProvider()
    router = LocalRoutingProvider()
    with pytest.raises(NotImplementedError):
        await geocoder.geocode_place("90210")
    with pytest.raises(NotImplementedError):
        await geocoder.candidates_for_store("Whole Foods", (0.0, 0.0))
    with pytest.raises(NotImplementedError):
        await router.matrix_minutes([(0.0, 0.0), (1.0, 1.0)])
    with pytest.raises(NotImplementedError):
        await router.route_line_geojson([(0.0, 0.0), (1.0, 1.0)])
