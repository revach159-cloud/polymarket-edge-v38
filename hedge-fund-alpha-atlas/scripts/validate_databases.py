#!/usr/bin/env python3
"""Validate database integrity and evidence-label discipline."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "databases"

REQUIRED = [
    "01_hedge_fund_database.json",
    "02_strategy_database.json",
    "03_trading_bot_database.json",
    "04_top_100_strategies.json",
    "05_top_50_deep_research.json",
    "06_strategy_reconstruction.json",
    "07_strategy_failures.json",
    "08_research_hypotheses.json",
]

VALUE_STATUSES = {"CONFIRMED", "ESTIMATED", "INFERRED", "UNKNOWN"}
EVIDENCE = {"CONFIRMED", "STRONGLY_SUPPORTED", "INFERRED", "ESTIMATED", "UNKNOWN", "SPECULATIVE"}


def load(name: str):
    return json.loads((DB / name).read_text(encoding="utf-8"))


def check_pv(path: str, obj: dict, errors: list[str]) -> None:
    if not isinstance(obj, dict):
        errors.append(f"{path}: expected provenance object")
        return
    if "status" not in obj or "value" not in obj:
        errors.append(f"{path}: missing value/status")
        return
    if obj["status"] not in VALUE_STATUSES:
        errors.append(f"{path}: bad status {obj['status']}")
    if obj["status"] == "UNKNOWN" and obj["value"] not in (None, "UNKNOWN"):
        # Allow none only
        if obj["value"] is not None:
            errors.append(f"{path}: UNKNOWN status should have null value")


def main() -> int:
    errors: list[str] = []
    for name in REQUIRED:
        if not (DB / name).exists():
            errors.append(f"missing {name}")

    if errors:
        print("FAIL")
        for e in errors:
            print(" -", e)
        return 1

    orgs = load("01_hedge_fund_database.json")["organizations"]
    strats = load("02_strategy_database.json")["strategies"]
    bots = load("03_trading_bot_database.json")["bots"]
    top100 = load("04_top_100_strategies.json")["top_100"]
    deep = load("05_top_50_deep_research.json")["deep_research"]
    hyps = load("08_research_hypotheses.json")["hypotheses"]

    if len(orgs) < 300:
        errors.append(f"organizations {len(orgs)} < 300")
    if len(top100) != 100:
        errors.append(f"top100 size {len(top100)}")
    if len(deep) != 50:
        errors.append(f"deep size {len(deep)}")
    if len(hyps) != 30:
        errors.append(f"hypotheses {len(hyps)} != 30")

    ids = [o["id"] for o in orgs]
    if len(ids) != len(set(ids)):
        errors.append("duplicate organization ids")

    sids = [s["id"] for s in strats]
    if len(sids) != len(set(sids)):
        errors.append("duplicate strategy ids")

    for s in strats:
        if s.get("evidence_level") not in EVIDENCE:
            errors.append(f"{s['id']}: bad evidence_level")
        perf = s.get("performance") or {}
        for k, v in perf.items():
            if isinstance(v, dict) and "status" in v:
                check_pv(f"{s['id']}.performance.{k}", v, errors)

    # No fabricated numeric returns without status
    for s in strats:
        for field in ("annualized_return", "sharpe", "sortino", "max_drawdown"):
            pv = (s.get("performance") or {}).get(field) or {}
            if pv.get("value") is not None and pv.get("status") not in VALUE_STATUSES:
                errors.append(f"{s['id']}.{field} missing provenance")

    print(
        f"Checked orgs={len(orgs)} strategies={len(strats)} bots={len(bots)} "
        f"top100={len(top100)} deep={len(deep)} hyps={len(hyps)}"
    )
    if errors:
        print("FAIL")
        for e in errors[:50]:
            print(" -", e)
        if len(errors) > 50:
            print(f" - ... {len(errors)-50} more")
        return 1

    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
