from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.domain.geo import haversine_m
from app.domain.models import NearbyPlace, NearbyRequest, NearbyResponse
from app.domain.places import ResolvedLocation
from app.services.provider_factory import build_providers

router = APIRouter(prefix="/api", tags=["nearby"])


def _short_name(display_address: str) -> str:
    parts = display_address.split(",")
    return parts[0].strip()[:100] if parts else display_address[:100]


def _to_nearby_places(
    origin: tuple[float, float], raw: list[ResolvedLocation]
) -> list[NearbyPlace]:
    olat, olng = origin
    max_m = settings.public_nearby_max_distance_m
    out: list[NearbyPlace] = []
    # Dedupe by rounded coordinates
    used: set[tuple[int, int]] = set()
    for loc in raw:
        d = haversine_m(olat, olng, loc.lat, loc.lng)
        if d > max_m:
            continue
        key = (round(loc.lat * 10000), round(loc.lng * 10000))
        if key in used:
            continue
        used.add(key)
        out.append(
            NearbyPlace(
                name=_short_name(loc.display_address),
                address=loc.display_address,
                lat=loc.lat,
                lng=loc.lng,
                distance_m=round(d, 1),
            )
        )
    out.sort(key=lambda p: p.distance_m)
    return out


@router.post("/nearby", response_model=NearbyResponse)
async def nearby_places(payload: NearbyRequest) -> NearbyResponse:
    geocoder, _ = build_providers()
    origin_loc = await geocoder.geocode_place(payload.origin_place)
    if origin_loc is None:
        raise HTTPException(
            status_code=400,
            detail="Could not find that starting location. Try a fuller address or city.",
        )
    origin_tuple = (origin_loc.lat, origin_loc.lng)
    try:
        raw = await geocoder.search_places_near(payload.search, origin_tuple)
    except NotImplementedError:
        raise HTTPException(
            status_code=501,
            detail="Nearby search is not available in local provider mode.",
        ) from None
    places = _to_nearby_places(origin_tuple, raw)
    return NearbyResponse(
        origin_query=payload.origin_place,
        origin_address=origin_loc.display_address,
        origin_lat=origin_loc.lat,
        origin_lng=origin_loc.lng,
        search=payload.search,
        places=places,
    )
