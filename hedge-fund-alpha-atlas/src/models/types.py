"""Shared types and provenance helpers for Hedge Fund Alpha Atlas."""

from __future__ import annotations

from enum import Enum
from typing import Any


class EvidenceLevel(str, Enum):
    CONFIRMED = "CONFIRMED"
    STRONGLY_SUPPORTED = "STRONGLY_SUPPORTED"
    INFERRED = "INFERRED"
    ESTIMATED = "ESTIMATED"
    UNKNOWN = "UNKNOWN"
    SPECULATIVE = "SPECULATIVE"


class ValueStatus(str, Enum):
    CONFIRMED = "CONFIRMED"
    ESTIMATED = "ESTIMATED"
    INFERRED = "INFERRED"
    UNKNOWN = "UNKNOWN"


STRATEGY_CATEGORIES = [
    "Momentum",
    "Trend following",
    "Mean reversion",
    "Statistical arbitrage",
    "Pairs trading",
    "Cross-sectional momentum",
    "Relative value",
    "Market making",
    "Arbitrage",
    "Volatility arbitrage",
    "Convertible arbitrage",
    "Merger arbitrage",
    "Event driven",
    "Macro",
    "Carry",
    "Basis trading",
    "Funding arbitrage",
    "Order-flow trading",
    "Liquidity provision",
    "Sentiment",
    "News trading",
    "Alternative data",
    "Machine learning",
    "Deep learning",
    "Reinforcement learning",
    "Options",
    "Volatility",
    "High frequency",
    "Low frequency",
]

EDGE_CATEGORIES = [
    "INFORMATION",
    "SPEED",
    "DATA",
    "STATISTICAL",
    "TECHNOLOGY",
    "EXECUTION",
    "LIQUIDITY",
    "STRUCTURAL",
    "BEHAVIORAL",
    "PRICING",
    "RISK_MANAGEMENT",
    "PORTFOLIO_CONSTRUCTION",
]

TIMEFRAMES = [
    "hft",
    "seconds",
    "minutes",
    "hours",
    "days",
    "weeks",
    "months",
    "long_term",
]


def pv(value: Any = None, status: str = "UNKNOWN", note: str | None = None) -> dict:
    """Create a provenance-wrapped value."""
    if value is None and status == "UNKNOWN":
        return {"value": None, "status": "UNKNOWN", "note": note}
    return {"value": value, "status": status, "note": note}


def ptext(text: str, evidence: str = "UNKNOWN") -> dict:
    """Create provenance-wrapped text."""
    return {"text": text, "evidence": evidence}


def empty_performance() -> dict:
    return {
        "return": pv(),
        "annualized_return": pv(),
        "sharpe": pv(),
        "sortino": pv(),
        "max_drawdown": pv(),
        "volatility": pv(),
        "aum": pv(),
        "cagr": pv(),
        "win_rate": pv(),
        "years_operating": pv(),
        "crisis_performance": pv(note=None),
        "consistency_note": pv(note=None),
    }


def slugify(name: str) -> str:
    s = name.lower()
    for ch in ".,/'\"()&+":
        s = s.replace(ch, "")
    s = s.replace(" ", "_").replace("-", "_")
    while "__" in s:
        s = s.replace("__", "_")
    return s.strip("_")
