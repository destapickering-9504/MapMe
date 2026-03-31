"""Parse stop strings such as ``Name, address`` from the planner UI."""

from __future__ import annotations

# Hints shorter than this are ignored to avoid treating "Brand, Inc" as a location.
_MIN_ADDRESS_HINT_LEN = 5


def stop_address_hint_after_comma(store: str) -> str | None:
    """If ``store`` looks like ``name, address``, return the address segment for geocoding.

    Used as an extra anchor alongside the trip anchor when resolving candidates.
    """
    if "," not in store:
        return None
    _, rest = store.split(",", 1)
    hint = rest.strip()
    if len(hint) < _MIN_ADDRESS_HINT_LEN:
        return None
    return hint


def effective_stop_anchor(
    trip_anchor: tuple[float, float],
    stop_hint_coords: tuple[float, float] | None,
) -> tuple[float, float]:
    """Blend trip anchor with a stop-specific geocode for clustering tie-breaks."""
    if stop_hint_coords is None:
        return trip_anchor
    return (
        (trip_anchor[0] + stop_hint_coords[0]) / 2.0,
        (trip_anchor[1] + stop_hint_coords[1]) / 2.0,
    )
