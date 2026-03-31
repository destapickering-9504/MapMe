from itertools import permutations

from app.domain.geo import haversine_m


def score_route_order(
    matrix: list[list[float]], store_order_zero_based: list[int], round_trip: bool
) -> float:
    """store_order_zero_based: indices 0..n-1 for stores; matrix row 0 = origin, 1..n = stores."""
    total = 0.0
    current = 0
    for store_idx in store_order_zero_based:
        next_row = store_idx + 1
        total += matrix[current][next_row]
        current = next_row
    if round_trip:
        total += matrix[current][0]
    return total


def score_route_to_fixed_destination(
    matrix: list[list[float]], store_order_zero_based: list[int], num_stores: int
) -> float:
    """Origin → stores (any order) → fixed destination.

    Matrix rows: 0 = origin, 1..num_stores = stores, num_stores+1 = destination.
    ``store_order_zero_based`` lists store indices 0..num_stores-1 mapping to matrix rows 1..num_stores.
    """
    dest_row = num_stores + 1
    total = 0.0
    current = 0
    for store_idx in store_order_zero_based:
        next_row = store_idx + 1
        total += matrix[current][next_row]
        current = next_row
    total += matrix[current][dest_row]
    return total


def zero_same_lot_store_matrix_legs(
    matrix: list[list[float]],
    points: list[tuple[float, float]],
    lot_radius_m: float,
) -> None:
    """Set store↔store driving minutes to 0 when geocoded pins are within the same lot.

    ``points[0]`` is the origin; ``points[1:]`` are stops. Origin legs are unchanged.
    """
    n = len(points)
    if n < 3:
        return
    for i in range(1, n):
        for j in range(i + 1, n):
            la, ln = points[i]
            lb, ln2 = points[j]
            if haversine_m(la, ln, lb, ln2) <= lot_radius_m:
                matrix[i][j] = 0.0
                matrix[j][i] = 0.0


def best_route_with_alternatives(
    matrix: list[list[float]],
    num_stores: int,
    round_trip: bool,
    top_n: int = 3,
) -> list[tuple[list[int], float]]:
    """Returns best routes as permutations of store indices 0..num_stores-1 (all orders)."""
    idx = list(range(num_stores))
    scored: list[tuple[list[int], float]] = []
    for order in permutations(idx):
        ol = list(order)
        minutes = score_route_order(matrix, ol, round_trip)
        scored.append((ol, minutes))
    scored.sort(key=lambda item: item[1])
    return scored[:top_n]


def best_route_one_way_end_last_list_stop(
    matrix: list[list[float]],
    num_stores: int,
    top_n: int = 3,
) -> list[tuple[list[int], float]]:
    """One-way without a separate destination: finish at the last stop in the submitted list.

    Store indices follow ``payload.stores`` order; index ``num_stores - 1`` must be visited last.
    Earlier stops may still be reordered for shortest time.
    """
    if num_stores < 1:
        return []
    idx = list(range(num_stores))
    last = num_stores - 1
    scored: list[tuple[list[int], float]] = []
    for order in permutations(idx):
        ol = list(order)
        if ol[-1] != last:
            continue
        minutes = score_route_order(matrix, ol, round_trip=False)
        scored.append((ol, minutes))
    scored.sort(key=lambda item: item[1])
    return scored[:top_n]


def best_route_with_fixed_destination(
    matrix: list[list[float]],
    num_stores: int,
    top_n: int = 3,
) -> list[tuple[list[int], float]]:
    """Best visit order from origin through all stores, ending at a fixed destination row."""
    idx = list(range(num_stores))
    scored: list[tuple[list[int], float]] = []
    for order in permutations(idx):
        ol = list(order)
        minutes = score_route_to_fixed_destination(matrix, ol, num_stores)
        scored.append((ol, minutes))
    scored.sort(key=lambda item: item[1])
    return scored[:top_n]


def best_permutation_round_trip(
    matrix: list[list[float]], num_stores: int, round_trip: bool
) -> tuple[list[int], float]:
    """Single fastest visit order for a fixed store-location assignment."""
    idx = list(range(num_stores))
    best_order: list[int] | None = None
    best_minutes = float("inf")
    for order in permutations(idx):
        ol = list(order)
        minutes = score_route_order(matrix, ol, round_trip)
        if minutes < best_minutes:
            best_minutes = minutes
            best_order = ol
    assert best_order is not None
    return best_order, best_minutes


def best_permutation_fixed_destination(
    matrix: list[list[float]], num_stores: int
) -> tuple[list[int], float]:
    """Single fastest visit order for a fixed assignment ending at a fixed destination row."""
    idx = list(range(num_stores))
    best_order: list[int] | None = None
    best_minutes = float("inf")
    for order in permutations(idx):
        ol = list(order)
        minutes = score_route_to_fixed_destination(matrix, ol, num_stores)
        if minutes < best_minutes:
            best_minutes = minutes
            best_order = ol
    assert best_order is not None
    return best_order, best_minutes
