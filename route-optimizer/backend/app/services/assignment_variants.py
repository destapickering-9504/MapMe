"""Build distinct store-location assignments (chain alternatives) from geocoder candidates."""

from __future__ import annotations

from app.domain.places import ResolvedLocation


def _loc_key(loc: ResolvedLocation) -> tuple[float, float]:
    return (round(loc.lat, 5), round(loc.lng, 5))


def assignment_fingerprint(locs: list[ResolvedLocation]) -> tuple[tuple[float, float], ...]:
    return tuple(_loc_key(loc) for loc in locs)


def expand_chain_assignment_variants(
    candidate_lists: list[list[ResolvedLocation]],
    primary: list[ResolvedLocation],
    max_rank_per_stop: int,
) -> list[list[ResolvedLocation]]:
    """Primary refinement plus swaps to other top geocoder hits per stop (different branches).

    ``max_rank_per_stop`` is how many ranked candidates per stop index to try (1 = primary only;
    3 = candidates[i][0], [1], [2] swapped in for stop i while other stops stay on ``primary``).
    """
    if not primary:
        return []
    n = len(primary)
    seen: set[tuple[tuple[float, float], ...]] = set()
    out: list[list[ResolvedLocation]] = []

    def push(locs: list[ResolvedLocation]) -> None:
        k = assignment_fingerprint(locs)
        if k in seen:
            return
        seen.add(k)
        out.append(locs)

    push(primary)
    cap = max(1, max_rank_per_stop)
    for i in range(n):
        cl = candidate_lists[i]
        for j in range(min(cap, len(cl))):
            alt = list(primary)
            alt[i] = cl[j]
            push(alt)
    return out
