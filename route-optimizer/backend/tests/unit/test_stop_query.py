from app.domain.stop_query import effective_stop_anchor, stop_address_hint_after_comma


def test_stop_address_hint_none_without_comma():
    assert stop_address_hint_after_comma("Target") is None


def test_stop_address_hint_none_when_suffix_too_short():
    assert stop_address_hint_after_comma("Acme, Inc") is None


def test_stop_address_hint_strips_and_requires_min_length():
    assert stop_address_hint_after_comma("Petco, 2001 15th Ave W") == "2001 15th Ave W"
    hint = stop_address_hint_after_comma("Old Navy, Alderwood Mall, Lynnwood WA")
    assert hint == "Alderwood Mall, Lynnwood WA"


def test_effective_stop_anchor_midpoint():
    trip = (47.0, -122.0)
    stop = (47.2, -122.2)
    m = effective_stop_anchor(trip, stop)
    assert m == (47.1, -122.1)


def test_effective_stop_anchor_without_hint():
    trip = (47.0, -122.0)
    assert effective_stop_anchor(trip, None) == trip
