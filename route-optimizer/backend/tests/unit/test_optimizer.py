from app.services.optimizer import (
    best_permutation_fixed_destination,
    best_permutation_round_trip,
    best_route_one_way_end_last_list_stop,
    best_route_with_alternatives,
    best_route_with_fixed_destination,
    score_route_order,
    score_route_to_fixed_destination,
    zero_same_lot_store_matrix_legs,
)


def test_score_route_order_round_trip_two_stores():
    matrix = [
        [0, 10, 15],
        [10, 0, 5],
        [15, 5, 0],
    ]
    # Stores are matrix rows 1 and 2; 0-based order [0, 1] => visit row1 then row2
    assert score_route_order(matrix, [0, 1], True) == 30


def test_best_permutation_matches_top_of_alternatives():
    matrix = [
        [0, 5, 20],
        [5, 0, 5],
        [20, 5, 0],
    ]
    perm, minutes = best_permutation_round_trip(matrix, 2, True)
    top = best_route_with_alternatives(matrix, 2, True, top_n=1)[0]
    assert perm == top[0] and minutes == top[1]


def test_best_permutation_fixed_destination_matches_top():
    matrix = [
        [0, 2, 10, 50],
        [2, 0, 3, 5],
        [10, 3, 0, 40],
        [50, 5, 40, 0],
    ]
    perm, minutes = best_permutation_fixed_destination(matrix, 2)
    top = best_route_with_fixed_destination(matrix, 2, top_n=1)[0]
    assert perm == top[0] and minutes == top[1]


def test_best_route_returns_sorted_options():
    matrix = [
        [0, 5, 20],
        [5, 0, 5],
        [20, 5, 0],
    ]
    results = best_route_with_alternatives(matrix, 2, True, top_n=2)
    assert len(results) == 2
    assert all(len(perm) == 2 for perm, _ in results)
    assert results[0][1] <= results[1][1]


def test_all_permutations_for_three_stores():
    matrix = [
        [0, 1, 1, 1],
        [1, 0, 1, 1],
        [1, 1, 0, 1],
        [1, 1, 1, 0],
    ]
    results = best_route_with_alternatives(matrix, 3, False, top_n=6)
    assert len(results) == 6


def test_one_way_end_last_list_stop_only_orders_ending_with_final_index():
    # Unrestricted one-way is cheaper ending at the first listed store; fixed policy forces last list index last.
    matrix = [
        [0, 50, 1],
        [50, 0, 50],
        [1, 50, 0],
    ]
    free = best_route_with_alternatives(matrix, 2, False, top_n=1)[0]
    assert free[0][-1] == 0

    fixed = best_route_one_way_end_last_list_stop(matrix, 2, top_n=1)[0]
    assert fixed[0] == [0, 1]
    assert fixed[0][-1] == 1


def test_zero_same_lot_only_store_to_store():
    matrix = [
        [0, 10, 10, 10],
        [10, 0, 99, 10],
        [10, 99, 0, 10],
        [10, 10, 10, 0],
    ]
    points = [
        (0.0, 0.0),
        (47.6, -122.35),
        (47.6011, -122.35),
        (50.0, -123.0),
    ]
    zero_same_lot_store_matrix_legs(matrix, points, 500.0)
    assert matrix[1][2] == 0.0
    assert matrix[2][1] == 0.0
    assert matrix[0][1] == 10.0
    assert matrix[1][3] == 10.0


def test_score_route_to_fixed_destination_two_stores():
    # rows: 0 origin, 1 store A, 2 store B, 3 destination
    matrix = [
        [0, 2, 10, 50],
        [2, 0, 3, 5],
        [10, 3, 0, 40],
        [50, 5, 40, 0],
    ]
    # A then B: 0->1 (2) + 1->2 (3) + 2->3 (40) = 45
    assert score_route_to_fixed_destination(matrix, [0, 1], 2) == 45.0
    # B then A: 0->2 (10) + 2->1 (3) + 1->3 (5) = 18
    assert score_route_to_fixed_destination(matrix, [1, 0], 2) == 18.0


def test_best_route_fixed_destination_picks_cheaper_order():
    matrix = [
        [0, 2, 10, 50],
        [2, 0, 3, 5],
        [10, 3, 0, 40],
        [50, 5, 40, 0],
    ]
    best, minutes = best_route_with_fixed_destination(matrix, 2, top_n=1)[0]
    assert best == [1, 0]
    assert minutes == 18.0


def test_best_route_uses_zero_min_same_lot_leg():
    """After zeroing the co-lot leg, visiting those stops consecutively saves real drive time."""
    matrix = [
        [0, 5, 5, 20],
        [5, 0, 99, 10],
        [5, 99, 0, 10],
        [5, 10, 10, 0],
    ]
    points = [
        (0.0, 0.0),
        (47.6, -122.35),
        (47.6011, -122.35),
        (48.0, -123.0),
    ]
    zero_same_lot_store_matrix_legs(matrix, points, 500.0)
    assert matrix[1][2] == 0.0
    best, minutes = best_route_with_alternatives(matrix, 3, True, top_n=1)[0]
    assert best == [0, 1, 2]
    assert minutes == 20.0
