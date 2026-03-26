from app.services.matrix_congestion import (
    amplify_legs_through_congestion_zone,
    build_travel_time_note,
    parse_congestion_bbox,
)


def test_parse_congestion_bbox_valid():
    assert parse_congestion_bbox(" 47.59 , -122.36 , 47.63 , -122.31 ") == (
        47.59,
        -122.36,
        47.63,
        -122.31,
    )


def test_parse_congestion_bbox_invalid():
    assert parse_congestion_bbox("") is None
    assert parse_congestion_bbox("1,2,3") is None
    assert parse_congestion_bbox("a,b,c,d") is None


def test_amplify_legs_touching_bbox():
    # Points: 0 outside, 1 inside box, 2 outside
    points = [(47.0, -123.0), (47.61, -122.34), (48.0, -123.0)]
    matrix = [
        [0.0, 10.0, 10.0],
        [10.0, 0.0, 10.0],
        [10.0, 10.0, 0.0],
    ]
    bbox = (47.6, -122.35, 47.62, -122.33)
    amplify_legs_through_congestion_zone(points, matrix, bbox, 2.0)
    assert matrix[0][1] == 20.0
    assert matrix[1][0] == 20.0
    assert matrix[0][2] == 10.0


def test_amplify_skips_zero_and_identity():
    points = [(47.61, -122.34), (47.61, -122.34)]
    matrix = [[0.0, 0.0], [0.0, 0.0]]
    bbox = (47.6, -122.35, 47.62, -122.33)
    amplify_legs_through_congestion_zone(points, matrix, bbox, 2.0)
    assert matrix[0][1] == 0.0


def test_build_travel_time_note_variants():
    assert "live traffic" in build_travel_time_note(congestion_adjustment_active=False).lower()
    assert "OPTIMIZER_CONGESTION" in build_travel_time_note(congestion_adjustment_active=True)
