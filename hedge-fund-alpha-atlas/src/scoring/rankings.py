"""Scoring and ranking engines (Rankings A–J + composites)."""

from __future__ import annotations

from typing import Any


def _num(pv: dict | None) -> float | None:
    if not pv or not isinstance(pv, dict):
        return None
    if pv.get("status") == "UNKNOWN":
        return None
    v = pv.get("value")
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def score_absolute_return(strategy: dict) -> float | None:
    perf = strategy.get("performance") or {}
    return _num(perf.get("annualized_return")) or _num(perf.get("cagr")) or _num(perf.get("return"))


def score_sharpe(strategy: dict) -> float | None:
    return _num((strategy.get("performance") or {}).get("sharpe"))


def score_sortino(strategy: dict) -> float | None:
    return _num((strategy.get("performance") or {}).get("sortino"))


def score_return_over_dd(strategy: dict) -> float | None:
    ret = score_absolute_return(strategy)
    dd = _num((strategy.get("performance") or {}).get("max_drawdown"))
    if ret is None or dd is None or dd == 0:
        return None
    return ret / abs(dd)


def score_longevity(strategy: dict) -> float | None:
    return _num((strategy.get("performance") or {}).get("years_operating"))


def score_consistency(strategy: dict) -> float:
    """Proxy consistency from longevity + evidence + inverse regime dependency."""
    longevity = score_longevity(strategy) or 0
    evidence_bonus = {
        "CONFIRMED": 25,
        "STRONGLY_SUPPORTED": 18,
        "INFERRED": 8,
        "ESTIMATED": 8,
        "SPECULATIVE": 0,
        "UNKNOWN": 0,
    }.get(strategy.get("evidence_level", "UNKNOWN"), 0)
    regime = strategy.get("regime_dependency_score") or 50
    return min(100.0, longevity * 1.5 + evidence_bonus + max(0, 50 - regime * 0.3))


def score_risk_adjusted(strategy: dict) -> float:
    sharpe = score_sharpe(strategy)
    quality = strategy.get("quality_score") or 0
    if sharpe is None:
        return float(quality) * 0.7
    return min(100.0, sharpe * 25 + quality * 0.35)


def score_research_interest(strategy: dict) -> float:
    if strategy.get("research_interest") is not None:
        return float(strategy["research_interest"])
    edge = strategy.get("edge_score") or 0
    repro = strategy.get("reproducibility_score") or 0
    quality = strategy.get("quality_score") or 0
    evidence_bonus = {
        "CONFIRMED": 15,
        "STRONGLY_SUPPORTED": 10,
        "INFERRED": 4,
        "SPECULATIVE": 0,
        "UNKNOWN": 0,
    }.get(strategy.get("evidence_level", "UNKNOWN"), 0)
    # Prefer strategies that are either highly evidenced OR highly interesting & partially reproducible
    return min(100.0, edge * 0.35 + repro * 0.25 + quality * 0.25 + evidence_bonus)


def score_automation(strategy: dict) -> float:
    text = ((strategy.get("automation") or {}).get("text") or "").lower()
    if "fully" in text or "near-fully" in text or "highly automated" in text:
        return 90.0
    if "systemat" in text or "automat" in text:
        return 70.0
    if "semi" in text:
        return 50.0
    if "human" in text or "discretion" in text:
        return 30.0
    return 40.0


def compute_all_ranking_scores(strategy: dict) -> dict[str, Any]:
    return {
        "A_absolute_return": score_absolute_return(strategy),
        "B_risk_adjusted": score_risk_adjusted(strategy),
        "C_sharpe": score_sharpe(strategy),
        "D_sortino": score_sortino(strategy),
        "E_return_over_drawdown": score_return_over_dd(strategy),
        "F_consistency": score_consistency(strategy),
        "G_longevity": score_longevity(strategy),
        "H_reproducibility": strategy.get("reproducibility_score"),
        "I_automation": score_automation(strategy),
        "J_research_interest": score_research_interest(strategy),
    }


def rank_strategies(strategies: list[dict], key: str, descending: bool = True) -> list[dict]:
    def sort_val(s: dict):
        scores = s.get("ranking_scores") or compute_all_ranking_scores(s)
        v = scores.get(key)
        if v is None:
            return float("-inf") if descending else float("inf")
        return v

    return sorted(strategies, key=sort_val, reverse=descending)


def build_top_100(strategies: list[dict]) -> list[dict]:
    enriched = []
    for s in strategies:
        s = dict(s)
        s["ranking_scores"] = compute_all_ranking_scores(s)
        enriched.append(s)

    # Composite for Top 100: emphasize research interest, evidence, quality, reproducibility
    def composite(s: dict) -> float:
        rs = s["ranking_scores"]
        j = rs.get("J_research_interest") or 0
        h = rs.get("H_reproducibility") or 0
        f = rs.get("F_consistency") or 0
        b = rs.get("B_risk_adjusted") or 0
        return j * 0.4 + h * 0.2 + f * 0.2 + b * 0.2

    ordered = sorted(enriched, key=composite, reverse=True)
    top = []
    for i, s in enumerate(ordered[:100], start=1):
        entry = {
            "rank": i,
            "strategy_id": s["id"],
            "name": s["name"],
            "composite_score": round(composite(s), 2),
            "ranking_scores": s["ranking_scores"],
            "edge_score": s.get("edge_score"),
            "quality_score": s.get("quality_score"),
            "reproducibility_score": s.get("reproducibility_score"),
            "evidence_level": s.get("evidence_level"),
            "categories": s.get("categories"),
            "core_edge": s.get("core_edge"),
        }
        top.append(entry)
    return top
