import pytest

from app.domain.places import ResolvedLocation
from app.services.store_candidate import choose_store_candidate, refine_store_locations_mutual


def test_empty_candidates_raises():
    with pytest.raises(ValueError):
        choose_store_candidate([], (0.0, 0.0), [], 500.0)


def test_no_prior_picks_closest_to_anchor():
    a = ResolvedLocation(lat=1.0, lng=1.0, display_address="A")
    b = ResolvedLocation(lat=10.0, lng=10.0, display_address="B")
    anchor = (1.01, 1.01)
    chosen = choose_store_candidate([b, a], anchor, [], 500.0)
    assert chosen.display_address == "A"


def test_prior_prefers_same_lot_over_anchor():
    """Far Petco is closer to anchor; near Petco is next to Whole Foods (prior)."""
    wf_lat, wf_lng = 47.637, -122.377
    prior = [(wf_lat, wf_lng)]
    anchor = (47.5, -122.5)
    far = ResolvedLocation(lat=47.8, lng=-122.2, display_address="Petco Far")
    near = ResolvedLocation(lat=wf_lat + 0.0004, lng=wf_lng + 0.0004, display_address="Petco Interbay")
    chosen = choose_store_candidate([far, near], anchor, prior, 500.0)
    assert chosen.display_address == "Petco Interbay"


def test_refine_single_stop_matches_anchor_pick():
    a = ResolvedLocation(lat=2.0, lng=2.0, display_address="near")
    b = ResolvedLocation(lat=20.0, lng=20.0, display_address="far")
    out = refine_store_locations_mutual([[b, a]], (0.0, 0.0), 500.0, max_rounds=3)
    assert len(out) == 1
    assert out[0].display_address == "near"


def test_mutual_refinement_aligns_interbay_petco_and_whole_foods():
    """Anchor can favor a far Petco; WF may start near user; refinement shares final pins."""
    lot = 500.0
    anchor = (47.6374, -122.3772)
    petco = [
        ResolvedLocation(lat=47.79, lng=-122.19, display_address="Petco Holman"),
        ResolvedLocation(lat=47.637, lng=-122.377, display_address="Petco Interbay"),
    ]
    whole_foods = [
        ResolvedLocation(lat=47.751, lng=-122.351, display_address="Whole Foods Roosevelt"),
        ResolvedLocation(lat=47.63703, lng=-122.37703, display_address="Whole Foods Interbay"),
    ]
    out = refine_store_locations_mutual(
        [petco, whole_foods], anchor, lot, max_rounds=10
    )
    assert out[0].display_address == "Petco Interbay"
    assert out[1].display_address == "Whole Foods Interbay"


def test_when_none_in_lot_falls_back_to_anchor_tiebreak():
    prior = [(0.0, 0.0)]
    anchor = (1.0, 1.0)
    x = ResolvedLocation(lat=5.0, lng=5.0, display_address="far from both")
    y = ResolvedLocation(lat=1.01, lng=1.01, display_address="near anchor")
    chosen = choose_store_candidate([x, y], anchor, prior, 50.0)
    assert chosen.display_address == "near anchor"


def test_joint_seed_prefers_colocated_cluster_over_individual_anchor_hits():
    """Each stop has a near-user wrong hit vs a cluster hit; joint pick should use the cluster."""
    lot = 500.0
    anchor = (47.55, -122.48)

    p_wf = ResolvedLocation(lat=47.637, lng=-122.377, display_address="WF plaza")
    p_pc = ResolvedLocation(lat=47.6372, lng=-122.3772, display_address="Petco plaza")
    p_tw = ResolvedLocation(lat=47.6371, lng=-122.3769, display_address="TW plaza")

    n_wf = ResolvedLocation(lat=47.56, lng=-122.47, display_address="WF wrong")
    n_pc = ResolvedLocation(lat=47.551, lng=-122.46, display_address="Petco wrong")
    n_tw = ResolvedLocation(lat=47.552, lng=-122.465, display_address="TW wrong")

    lists = [
        [n_wf, p_wf],
        [n_pc, p_pc],
        [n_tw, p_tw],
    ]
    out = refine_store_locations_mutual(lists, anchor, lot, max_rounds=6)
    assert out[0].display_address == "WF plaza"
    assert out[1].display_address == "Petco plaza"
    assert out[2].display_address == "TW plaza"
