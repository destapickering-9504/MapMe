from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.domain.models import OptimizeRequest, OptimizeResponse, RouteOption, StopDetail
from app.domain.places import ResolvedLocation
from app.domain.stop_query import effective_stop_anchor, stop_address_hint_after_comma
from app.services.assignment_variants import assignment_fingerprint, expand_chain_assignment_variants
from app.services.matrix_congestion import (
    amplify_legs_through_congestion_zone,
    build_travel_time_note,
    parse_congestion_bbox,
)
from app.services.optimizer import (
    best_route_one_way_end_last_list_stop,
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


def _pick_top_distinct_routes(
    scored: list[tuple[list[ResolvedLocation], list[int], float]],
    limit: int = 3,
) -> list[tuple[list[ResolvedLocation], list[int], float]]:
    """Keep fastest routes with distinct (store assignment × visit order)."""
    scored = sorted(scored, key=lambda item: item[2])
    out: list[tuple[list[ResolvedLocation], list[int], float]] = []
    seen: set[tuple[tuple[tuple[float, float], ...], tuple[int, ...]]] = set()
    for assign_locs, perm, minutes in scored:
        key = (assignment_fingerprint(assign_locs), tuple(perm))
        if key in seen:
            continue
        seen.add(key)
        out.append((assign_locs, perm, minutes))
        if len(out) >= limit:
            break
    return out


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

    # Stops with "name, address" (UI specific-address field): geocode the address once and pin that pin.
    stop_hint_resolved: list[ResolvedLocation | None] = []
    for store in payload.stores:
        hint = stop_address_hint_after_comma(store)
        if hint is None:
            stop_hint_resolved.append(None)
            continue
        hint_loc = await geocoder.geocode_place(hint)
        if hint_loc is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    f'Could not find a match for the address added to stop "{store}". '
                    "Try a fuller street, city, or ZIP in the address field."
                ),
            )
        stop_hint_resolved.append(hint_loc)

    per_stop_anchors = [
        effective_stop_anchor(anchor, (loc.lat, loc.lng) if loc else None)
        for loc in stop_hint_resolved
    ]

    candidate_lists: list[list[ResolvedLocation]] = []
    for i, store in enumerate(payload.stores):
        locked = stop_hint_resolved[i]
        if locked is not None:
            candidate_lists.append([locked])
            continue
        candidates = await geocoder.candidates_for_store(
            store, anchor, stop_anchor=None
        )
        if not candidates:
            raise HTTPException(
                status_code=400,
                detail=f'Could not find a match for stop "{store}". Try a full street address or name.',
            )
        candidate_lists.append(candidates)

    lot_r = settings.optimizer_same_lot_radius_m
    store_locations = refine_store_locations_mutual(
        candidate_lists, per_stop_anchors, lot_r, max_rounds=8
    )

    n = len(store_locations)
    assignments = expand_chain_assignment_variants(
        candidate_lists,
        store_locations,
        settings.optimizer_chain_alt_ranks,
    )

    round_trip = payload.trip_mode == "round_trip"
    scored_entries: list[tuple[list[ResolvedLocation], list[int], float]] = []

    congestion_bbox = parse_congestion_bbox(settings.optimizer_congestion_bbox)
    congestion_factor = settings.optimizer_congestion_leg_multiplier
    congestion_on = (
        congestion_bbox is not None
        and congestion_factor > 1.0
    )
    travel_time_note = build_travel_time_note(congestion_adjustment_active=congestion_on)

    perm_top_n = max(15, math.factorial(n) if n <= 4 else 24)

    for assign_locs in assignments:
        if dest_loc is not None:
            points = (
                [origin_tuple]
                + [(loc.lat, loc.lng) for loc in assign_locs]
                + [(dest_loc.lat, dest_loc.lng)]
            )
        else:
            points = [origin_tuple] + [(loc.lat, loc.lng) for loc in assign_locs]

        matrix = await routing.matrix_minutes(points)
        zero_same_lot_store_matrix_legs(matrix, points, lot_r)
        if congestion_on and congestion_bbox is not None:
            amplify_legs_through_congestion_zone(
                points, matrix, congestion_bbox, congestion_factor
            )

        if dest_loc is not None:
            ranked_perms = best_route_with_fixed_destination(matrix, n, top_n=perm_top_n)
        elif round_trip:
            ranked_perms = best_route_with_alternatives(
                matrix, n, round_trip=True, top_n=perm_top_n
            )
        else:
            ranked_perms = best_route_one_way_end_last_list_stop(
                matrix, n, top_n=perm_top_n
            )

        for perm, minutes in ranked_perms:
            scored_entries.append((assign_locs, perm, minutes))

    ranked = _pick_top_distinct_routes(scored_entries, limit=3)

    nf = math.factorial(n) if n > 0 else 1
    nf_one_way_last_fixed = math.factorial(n - 1) if n > 1 else 1
    n_assign = len(assignments)
    if dest_loc is not None:
        explanation = (
            f"Compared {n_assign} different store-location sets from search results and, for each, all {nf} "
            "visit orders to your end point. The routes listed here are different location choices where "
            "possible—not only reordering the same stops."
        )
    elif round_trip:
        explanation = (
            f"Compared {n_assign} different store-location sets from search results and, for each, all {nf} "
            "visit orders for a round trip. Listed routes prefer alternate branches (e.g. another Target) "
            "when they differ from your best match—not just the same pins in a different order."
        )
    else:
        explanation = (
            f"Compared {n_assign} different store-location sets from search results and, for each, all "
            f"{nf_one_way_last_fixed} one-way visit orders that end at your last listed stop (earlier stops "
            "reordered for time). Listed routes use different matched locations where available."
        )

    route_geojson_options: list[dict | None] = []
    for assign_locs, perm, _minutes in ranked:
        if dest_loc is not None:
            wps = _waypoints_lat_lng_to_destination(
                origin_loc, perm, assign_locs, dest_loc
            )
        else:
            wps = _waypoints_lat_lng_for_perm(
                origin_loc, perm, assign_locs, round_trip
            )
        route_geojson_options.append(await routing.route_line_geojson(wps))

    best_assign_locs, best_perm, best_minutes = ranked[0]
    alt_options = [
        _route_option(perm, minutes, payload.stores, assign_locs)
        for assign_locs, perm, minutes in ranked[1:]
    ]

    stops_resolved = [
        _to_stop_detail(payload.stores[i], best_assign_locs[i]) for i in range(n)
    ]
    if dest_loc is None and not round_trip and n >= 1:
        permutations_considered = n_assign * nf_one_way_last_fixed
    else:
        permutations_considered = n_assign * nf

    best_route_geojson = route_geojson_options[0] if route_geojson_options else None

    return OptimizeResponse(
        trip_mode=payload.trip_mode,
        origin_query=payload.origin_place,
        origin_label=payload.origin_label,
        origin_address=origin_loc.display_address,
        origin_lat=origin_loc.lat,
        origin_lng=origin_loc.lng,
        stops_resolved=stops_resolved,
        permutations_considered=permutations_considered,
        best_route=_route_option(best_perm, best_minutes, payload.stores, best_assign_locs),
        alternatives=alt_options,
        explanation=explanation,
        travel_time_note=travel_time_note,
        best_route_geojson=best_route_geojson,
        route_geojson_options=route_geojson_options,
        destination_query=payload.destination_place,
        destination_address=dest_loc.display_address if dest_loc else None,
        destination_lat=dest_loc.lat if dest_loc else None,
        destination_lng=dest_loc.lng if dest_loc else None,
    )
