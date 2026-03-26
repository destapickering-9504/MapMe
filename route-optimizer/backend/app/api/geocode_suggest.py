from __future__ import annotations

import httpx
from fastapi import APIRouter, Query

from app.core.config import settings
from app.domain.models import AddressSuggestResponse, AddressSuggestion
from app.services.providers.public.geocoder_public import _places_from_nominatim_payload

router = APIRouter(prefix="/api", tags=["geocode"])


@router.get("/geocode/suggest", response_model=AddressSuggestResponse)
async def address_suggest(
    q: str = Query("", max_length=280, description="Partial address or place name"),
) -> AddressSuggestResponse:
    """Autocomplete-style address search (Nominatim in public mode)."""
    if settings.provider_mode != "public":
        return AddressSuggestResponse(suggestions=[])

    text = q.strip()
    if len(text) < settings.public_suggest_min_chars:
        return AddressSuggestResponse(suggestions=[])

    limit = min(max(settings.public_suggest_limit, 1), 15)
    params = {
        "q": text,
        "format": "jsonv2",
        "limit": str(limit),
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
    except (httpx.HTTPError, ValueError, TypeError):
        return AddressSuggestResponse(suggestions=[])

    if not isinstance(payload, list):
        return AddressSuggestResponse(suggestions=[])

    places = _places_from_nominatim_payload(payload)
    suggestions = [
        AddressSuggestion(label=p.display_address[:400], lat=p.lat, lng=p.lng) for p in places
    ]
    return AddressSuggestResponse(suggestions=suggestions)
