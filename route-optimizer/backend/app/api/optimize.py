from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.domain.models import OptimizeRequest, OptimizeResponse, RouteOption, StopDetail
from app.domain.places import ResolvedLocation
from app.services.optimizer import (
    best_route_with_alternatives,
    best_route_with_fixed_destination,
    zero_same_lot_store_matrix_legs,
)
from app.services.provider_factory import build_providers
from app.services.store_candidate import refine_store_locations_mutual

router = APIRouter(prefix="/api", tags=["optimize"])


def _to_stop_detail(query: str, loc: ResolvedLocation) -> StopDetail:
    return StopDetail(
        query=query,
        address=loc.display_address,
        lat=loc.lat,
        lng=loc.lng,
    )


def _waypoints_lat_lng_for_perm(
    origin_loc: ResolvedLocation,
    perm: list[int],
    store_locations: list[ResolvedLocation],
    round_trip: bool,
) -> list[tuple[float, float]]:
    pts: list[tuple[float, float]] = [(origin_loc.lat, origin_loc.lng)]
    for i in perm:
        loc = store_locations[i]
        pts.append((loc.lat, loc.lng))
    if round_trip:
        pts.append((origin_loc.lat, origin_loc.lng))
    return pts


def _waypoints_lat_lng_to_destination(
    origin_loc: ResolvedLocation,
    perm: list[int],
    store_locations: list[ResolvedLocation],
    dest_loc: ResolvedLocation,
) -> list[tuple[float, float]]:
    pts: list[tuple[float, float]] = [(origin_loc.lat, origin_loc.lng)]
    for i in perm:
        loc = store_locations[i]
        pts.append((loc.lat, loc.lng))
    pts.append((dest_loc.lat, dest_loc.lng))
    return pts


def _geocode_anchor_for_stores(
    origin_tuple: tuple[float, float],
    dest_loc: ResolvedLocation | None,
) -> tuple[float, float]:
    """Bias store search between start and end when both exist."""
    if dest_loc is None:
        return origin_tuple
    return (
        (origin_tuple[0] + dest_loc.lat) / 2.0,
        (origin_tuple[1] + dest_loc.lng) / 2.0,
    )


def _route_option(
    perm: list[int],
    minutes: float,
    store_queries: list[str],
    store_locations: list[ResolvedLocation],
) -> RouteOption:
    ordered_stores = [store_queries[i] for i in perm]
    ordered_stops = [_to_stop_detail(store_queries[i], store_locations[i]) for i in perm]
    return RouteOption(
        ordered_stores=ordered_stores,
        ordered_stops=ordered_stops,
        total_minutes=minutes,
    )


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_route(payload: OptimizeRequest) -> OptimizeResponse:
    geocoder, routing = build_providers()
    origin_loc = await geocoder.geocode_place(payload.origin_place)
    if origin_loc is None:
        raise HTTPException(
            status_code=400,
            detail="Could not find that starting location. Try a fuller street address, ZIP, or city.",
        )

    origin_tuple = (origin_loc.lat, origin_loc.lng)
    dest_loc: ResolvedLocation | None = None
    if payload.destination_place:
        dest_loc = await geocoder.geocode_place(payload.destination_place)
        if dest_loc is None:
            raise HTTPException(
                status_code=400,
                detail="Could not find that end location. Try a fuller street address, ZIP, or city.",
            )

    anchor = _geocode_anchor_for_stores(origin_tuple, dest_loc)
    candidate_lists: list[list[ResolvedLocation]] = []
    for store in payload.stores:
        candidates = await geocoder.candidates_for_store(store, anchor)
        if not candidates:
            raise HTTPException(
                status_code=400,
                detail=f'Could not find a match for stop "{store}". Try a full street address or name.',
            )
        candidate_lists.append(candidates)

    lot_r = settings.optimizer_same_lot_radius_m
    store_locations = refine_store_locations_mutual(
        candidate_lists, anchor, lot_r, max_rounds=8
    )

    n = len(store_locations)
    if dest_loc is not None:
        points = (
            [origin_tuple]
            + [(loc.lat, loc.lng) for loc in store_locations]
            + [(dest_loc.lat, dest_loc.lng)]
        )
    else:
        points = [origin_tuple] + [(loc.lat, loc.lng) for loc in store_locations]

    matrix = await routing.matrix_minutes(points)
    zero_same_lot_store_matrix_legs(matrix, points, settings.optimizer_same_lot_radius_m)

    round_trip = payload.trip_mode == "round_trip"
    if dest_loc is not None:
        ranked = best_route_with_fixed_destination(matrix, n, top_n=3)
        explanation = (
            f"Evaluated all {math.factorial(n)} ways to order your stops between start and end; "
            "the recommended route has the lowest total driving time for that path."
        )
    else:
        ranked = best_route_with_alternatives(matrix, n, round_trip, top_n=3)
        if round_trip:
            explanation = (
                f"Evaluated all {math.factorial(n)} possible visit orders; "
                "the recommended route has the lowest total driving time, returning to the start."
            )
        else:
            explanation = (
                f"Evaluated all {math.factorial(n)} possible visit orders; "
                "the recommended route has the lowest total driving time (one way, ending at the last stop)."
            )

    route_geojson_options: list[dict | None] = []
    for perm, _minutes in ranked:
        if dest_loc is not None:
            wps = _waypoints_lat_lng_to_destination(
                origin_loc, perm, store_locations, dest_loc
            )
        else:
            wps = _waypoints_lat_lng_for_perm(
                origin_loc, perm, store_locations, round_trip
            )
        route_geojson_options.append(await routing.route_line_geojson(wps))

    best_perm, best_minutes = ranked[0]
    alt_options = [
        _route_option(perm, minutes, payload.stores, store_locations)
        for perm, minutes in ranked[1:]
    ]

    stops_resolved = [
        _to_stop_detail(payload.stores[i], store_locations[i]) for i in range(n)
    ]
    permutations_considered = math.factorial(n) if n > 0 else 0

    best_route_geojson = route_geojson_options[0] if route_geojson_options else None

    return OptimizeResponse(
        trip_mode=payload.trip_mode,
        origin_query=payload.origin_place,
        origin_address=origin_loc.display_address,
        origin_lat=origin_loc.lat,
        origin_lng=origin_loc.lng,
        stops_resolved=stops_resolved,
        permutations_considered=permutations_considered,
        best_route=_route_option(best_perm, best_minutes, payload.stores, store_locations),
        alternatives=alt_options,
        explanation=explanation,
        best_route_geojson=best_route_geojson,
        route_geojson_options=route_geojson_options,
        destination_query=payload.destination_place,
        destination_address=dest_loc.display_address if dest_loc else None,
        destination_lat=dest_loc.lat if dest_loc else None,
        destination_lng=dest_loc.lng if dest_loc else None,
    )
