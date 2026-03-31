"""Optional rough slowdown for matrix legs that pass through a configured map rectangle.

OSRM (and our public endpoint) uses typical/free-flow speeds, not live traffic. This helper
only nudges durations for legs that touch a bbox you configure (e.g. a downtown core) so
optimization can prefer routes that avoid that area when all else is equal.
"""

from __future__ import annotations


def parse_congestion_bbox(raw: str) -> tuple[float, float, float, float] | None:
    """Return ``(south, west, north, east)`` in decimal degrees, or ``None`` if unset/invalid."""
    text = raw.strip()
    if not text:
        return None
    parts = [p.strip() for p in text.split(",")]
    if len(parts) != 4:
        return None
    try:
        south, west, north, east = (float(x) for x in parts)
    except ValueError:
        return None
    if south > north or west > east:
        return None
    return south, west, north, east


def amplify_legs_through_congestion_zone(
    points: list[tuple[float, float]],
    matrix: list[list[float]],
    bbox: tuple[float, float, float, float],
    factor: float,
) -> None:
    """Multiply positive leg durations when either endpoint or the midpoint lies inside ``bbox``."""
    if factor <= 1.0:
        return
    south, west, north, east = bbox

    def in_rect(lat: float, lng: float) -> bool:
        return south <= lat <= north and west <= lng <= east

    n = len(points)
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            if matrix[i][j] <= 0.0:
                continue
            la, ln = points[i]
            lb, ln2 = points[j]
            mid_lat = (la + lb) / 2.0
            mid_lng = (ln + ln2) / 2.0
            if in_rect(la, ln) or in_rect(lb, ln2) or in_rect(mid_lat, mid_lng):
                matrix[i][j] *= factor


def build_travel_time_note(*, congestion_adjustment_active: bool) -> str:
    """User-facing explanation of duration model (no live traffic) and optional bbox fudge."""
    base = (
        "Drive times use free-flow speeds from map data (OpenStreetMap via OSRM), not live traffic. "
        "Busy downtowns and rush hour are usually slower in real life—use minutes as a guide, not a promise."
    )
    if congestion_adjustment_active:
        return (
            base
            + " A congestion-style multiplier is applied to legs that touch the server's configured map box "
            "(OPTIMIZER_CONGESTION_BBOX / OPTIMIZER_CONGESTION_LEG_MULTIPLIER)."
        )
    return (
        base
        + " To roughly penalize legs through a dense core (e.g. downtown), set those environment variables."
    )
