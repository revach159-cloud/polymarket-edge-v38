"""Basic unit tests for scoring and seed integrity."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.discovery.universe_seeds import iter_organization_seeds
from src.scoring.rankings import compute_all_ranking_scores, build_top_100
from src.models.types import empty_performance, pv, ptext


def test_universe_at_least_300():
    orgs = list(iter_organization_seeds())
    assert len(orgs) >= 300


def test_ranking_handles_unknown_performance():
    s = {
        "id": "strat_test",
        "name": "Test",
        "performance": empty_performance(),
        "evidence_level": "INFERRED",
        "edge_score": 50,
        "quality_score": 50,
        "reproducibility_score": 50,
        "automation": ptext("automated"),
        "research_interest": 60,
    }
    scores = compute_all_ranking_scores(s)
    assert scores["A_absolute_return"] is None
    assert scores["J_research_interest"] == 60


def test_top_100_length():
    strategies = []
    for i in range(120):
        strategies.append(
            {
                "id": f"strat_{i}",
                "name": f"S{i}",
                "performance": empty_performance(),
                "evidence_level": "INFERRED",
                "edge_score": i % 100,
                "quality_score": 40,
                "reproducibility_score": 40,
                "automation": ptext("systematic"),
                "research_interest": i % 100,
                "categories": ["Momentum"],
                "core_edge": "STATISTICAL",
            }
        )
    top = build_top_100(strategies)
    assert len(top) == 100
    assert top[0]["rank"] == 1


def test_provenance_unknown_default():
    x = pv()
    assert x["status"] == "UNKNOWN"
    assert x["value"] is None
