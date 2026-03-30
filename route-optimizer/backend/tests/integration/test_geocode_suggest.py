from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

import app.api.geocode_suggest as suggest_module
from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_suggest_short_query_returns_empty() -> None:
    response = client.get("/api/geocode/suggest", params={"q": "12"})
    assert response.status_code == 200
    assert response.json() == {"suggestions": []}


def test_suggest_public_mode_calls_nominatim(monkeypatch: pytest.MonkeyPatch) -> None:
    class _Resp:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> list:
            return [
                {
                    "lat": "47.6",
                    "lon": "-122.3",
                    "display_name": "123 Main St, Seattle, WA, USA",
                }
            ]

    class _Client:
        def __init__(self, *a, **k) -> None:
            pass

        async def __aenter__(self) -> "_Client":
            return self

        async def __aexit__(self, *a) -> None:
            return None

        async def get(self, url: str, params: dict, headers: dict) -> _Resp:
            assert "search" in url
            assert params.get("q") == "123 main"
            return _Resp()

    monkeypatch.setattr(settings, "provider_mode", "public")
    monkeypatch.setattr(suggest_module.httpx, "AsyncClient", _Client)

    response = client.get("/api/geocode/suggest", params={"q": "123 main"})
    assert response.status_code == 200
    body = response.json()
    assert len(body["suggestions"]) == 1
    assert "Seattle" in body["suggestions"][0]["label"]


def test_suggest_local_mode_still_uses_nominatim(monkeypatch: pytest.MonkeyPatch) -> None:
    """Autocomplete must work in local provider mode too (optimize may use a different geocoder)."""

    class _Resp:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> list:
            return [
                {
                    "lat": "40.7",
                    "lon": "-74.0",
                    "display_name": "NYC, NY, USA",
                }
            ]

    class _Client:
        def __init__(self, *a, **k) -> None:
            pass

        async def __aenter__(self) -> "_Client":
            return self

        async def __aexit__(self, *a) -> None:
            return None

        async def get(self, url: str, params: dict, headers: dict) -> _Resp:
            return _Resp()

    monkeypatch.setattr(settings, "provider_mode", "local")
    monkeypatch.setattr(suggest_module.httpx, "AsyncClient", _Client)

    response = client.get("/api/geocode/suggest", params={"q": "nyc main"})
    assert response.status_code == 200
    body = response.json()
    assert len(body["suggestions"]) == 1
    assert "NYC" in body["suggestions"][0]["label"]
