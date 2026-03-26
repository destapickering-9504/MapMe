"""Resolve each stop to one geocoded candidate: prefer assignments that cluster together."""

from __future__ import annotations

from itertools import product
from typing import Sequence, Union

from app.domain.geo import haversine_m
from app.domain.places import ResolvedLocation

# Cap exhaustive joint assignment (product of candidate list lengths). Above this, use sequential seed.
_JOINT_ASSIGNMENT_MAX_PRODUCT = 8192


def choose_store_candidate(
    candidates: list[ResolvedLocation],
    anchor: tuple[float, float],
    prior_store_coords: list[tuple[float, float]],
    lot_radius_m: float,
) -> ResolvedLocation:
    """Pick one candidate: prefer options that sit with as many other resolved stops as possible.

    When there are no priors yet, use distance from the trip anchor (e.g. start). Otherwise
    prefer candidates within ``lot_radius_m`` of one or more priors; among those, prefer being
    within range of *more* priors, then tighter geometry, then anchor distance.
    """
    if not candidates:
        raise ValueError("candidates must be non-empty")

    if not prior_store_coords:

        def anchor_only(loc: ResolvedLocation) -> float:
            return haversine_m(anchor[0], anchor[1], loc.lat, loc.lng)

        return min(candidates, key=anchor_only)

    def cluster_key(loc: ResolvedLocation) -> tuple[int, int, float, float]:
        distances = [
            haversine_m(loc.lat, loc.lng, px, py) for px, py in prior_store_coords
        ]
        min_d = min(distances)
        within_radius = sum(1 for d in distances if d <= lot_radius_m)
        d_anchor = haversine_m(anchor[0], anchor[1], loc.lat, loc.lng)
        in_cluster = min_d <= lot_radius_m
        if in_cluster:
            # More nearby resolved stops = stronger shared location; then tighter, then anchor.
            return (0, -within_radius, min_d, d_anchor)
        return (1, 0, min_d, d_anchor)

    return min(candidates, key=cluster_key)


def _pairwise_colocated_count(
    picks: Sequence[ResolvedLocation], lot_radius_m: float
) -> int:
    n = len(picks)
    count = 0
    for i in range(n):
        for j in range(i + 1, n):
            if (
                haversine_m(picks[i].lat, picks[i].lng, picks[j].lat, picks[j].lng)
                <= lot_radius_m
            ):
                count += 1
    return count


def _assignment_sort_key(
    picks: Sequence[ResolvedLocation],
    anchors: Sequence[tuple[float, float]],
    lot_radius_m: float,
) -> tuple[int, float]:
    """Lower is better: maximize colocated pairs, then minimize per-stop anchor distances."""
    pairs = _pairwise_colocated_count(picks, lot_radius_m)
    anchor_sum = sum(
        haversine_m(anchors[i][0], anchors[i][1], picks[i].lat, picks[i].lng)
        for i in range(len(picks))
    )
    return (-pairs, anchor_sum)


def _joint_cluster_seed(
    candidate_lists: list[list[ResolvedLocation]],
    anchors: list[tuple[float, float]],
    lot_radius_m: float,
    max_product: int = _JOINT_ASSIGNMENT_MAX_PRODUCT,
) -> list[ResolvedLocation] | None:
    """If small enough, pick the candidate tuple that clusters stops together best.

    This avoids bad sequential seeds when every stop has a plausible hit closer to the user
    than to the retail cluster the user implied by listing those stops together.
    """
    prod = 1
    for cl in candidate_lists:
        if not cl:
            return None
        prod *= len(cl)
        if prod > max_product:
            return None

    best_key: tuple[int, float] | None = None
    best_picks: list[ResolvedLocation] | None = None
    for combo in product(*candidate_lists):
        picks = list(combo)
        key = _assignment_sort_key(picks, anchors, lot_radius_m)
        if best_key is None or key < best_key:
            best_key = key
            best_picks = picks
    return best_picks


def _locations_within_m(
    a: list[ResolvedLocation], b: list[ResolvedLocation], epsilon_m: float
) -> bool:
    if len(a) != len(b):
        return False
    return all(
        haversine_m(x.lat, x.lng, y.lat, y.lng) < epsilon_m for x, y in zip(a, b)
    )


def refine_store_locations_mutual(
    candidate_lists: list[list[ResolvedLocation]],
    anchor: Union[tuple[float, float], list[tuple[float, float]]],
    lot_radius_m: float,
    max_rounds: int = 8,
) -> list[ResolvedLocation]:
    """Pick one resolved location per stop, favoring sets that cluster near each other.

    ``anchor`` is either one tuple applied to every stop or a per-stop list (same length as
    ``candidate_lists``) blending trip anchor with an optional stop-specific address anchor.

    Starts from a joint optimum over candidate combinations when enumeration is cheap; otherwise
    falls back to a sequential seed. Then iterates until picks stabilize under mutual updates.
    """
    n = len(candidate_lists)
    if n == 0:
        return []

    if isinstance(anchor, tuple):
        anchors = [anchor] * n
    else:
        if len(anchor) != n:
            raise ValueError("anchor list length must match number of stops")
        anchors = list(anchor)

    joint = _joint_cluster_seed(candidate_lists, anchors, lot_radius_m)
    if joint is not None:
        locations = joint
    else:
        locations = []
        for i in range(n):
            prior_coords = [(loc.lat, loc.lng) for loc in locations]
            locations.append(
                choose_store_candidate(
                    candidate_lists[i], anchors[i], prior_coords, lot_radius_m
                )
            )
    for _ in range(max(1, max_rounds) - 1):
        next_locs: list[ResolvedLocation] = []
        for i in range(n):
            prior_coords = [
                (locations[j].lat, locations[j].lng) for j in range(n) if j != i
            ]
            next_locs.append(
                choose_store_candidate(
                    candidate_lists[i], anchors[i], prior_coords, lot_radius_m
                )
            )
        if _locations_within_m(locations, next_locs, epsilon_m=3.0):
            return next_locs
        locations = next_locs
    return locations
