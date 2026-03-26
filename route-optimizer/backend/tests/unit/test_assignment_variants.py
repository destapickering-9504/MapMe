from app.domain.places import ResolvedLocation
from app.services.assignment_variants import expand_chain_assignment_variants


def test_expand_keeps_primary_and_one_off_swaps():
    a1 = ResolvedLocation(lat=1.0, lng=1.0, display_address="A1")
    a2 = ResolvedLocation(lat=2.0, lng=2.0, display_address="A2")
    b1 = ResolvedLocation(lat=3.0, lng=3.0, display_address="B1")
    primary = [a1, b1]
    candidate_lists = [[a1, a2], [b1]]
    out = expand_chain_assignment_variants(candidate_lists, primary, max_rank_per_stop=3)
    keys = {tuple((round(l.lat, 5), round(l.lng, 5)) for l in row) for row in out}
    assert len(out) == len(keys) == 2
    assert any(len([l for l in row if l.display_address == "A2"]) == 1 for row in out)


def test_expand_single_stop():
    p = ResolvedLocation(lat=1.0, lng=1.0, display_address="only")
    primary = [p]
    out = expand_chain_assignment_variants([[p]], primary, max_rank_per_stop=2)
    assert len(out) == 1
