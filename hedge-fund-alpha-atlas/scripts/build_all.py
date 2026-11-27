#!/usr/bin/env python3
"""Build all Hedge Fund Alpha Atlas databases (01–08) from curated seeds."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.discovery.bot_seeds import BOTS, extra_bot_stubs
from src.discovery.source_seeds import SOURCES
from src.discovery.strategy_seeds import STRATEGIES, more_strategy_templates
from src.discovery.universe_seeds import iter_organization_seeds
from src.models.types import empty_performance, pv, ptext, slugify
from src.scoring.rankings import build_top_100, compute_all_ranking_scores


DB = ROOT / "databases"
DB.mkdir(parents=True, exist_ok=True)


def write_json(name: str, payload: dict | list) -> Path:
    path = DB / name
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {path} ({path.stat().st_size} bytes)")
    return path


def build_organizations() -> list[dict]:
    orgs = []
    known_for_map = {
        "Renaissance Technologies": "Medallion Fund; short-horizon statistical prediction ensembles",
        "D. E. Shaw & Co.": "Computational trading pioneer; multi-strategy quant",
        "Two Sigma": "Data-driven / ML systematic investing",
        "Citadel": "Multi-strategy hedge fund platform",
        "Citadel Securities": "Electronic market making / wholesaler",
        "Jane Street": "ETF/relative-value trading; quantitative prop",
        "Jump Trading": "HFT / research-driven proprietary trading",
        "Hudson River Trading": "HFT algorithmic trading",
        "Virtu Financial": "Public electronic market maker",
        "XTX Markets": "ML-driven electronic market making",
        "AQR Capital Management": "Academic-rooted factor / risk premia",
        "Man Group / Man AHL": "Systematic CTA and quant multi-strategy",
        "Bridgewater Associates": "Macro / Pure Alpha / All Weather framing",
        "WorldQuant": "Alpha research platform + BRAIN crowdsourcing",
        "Numerai": "Crowdsourced ML stock model tournament",
    }
    markets_by_type = {
        "hft": ["Equities", "Futures", "ETFs"],
        "market_maker": ["Equities", "ETFs", "Options", "FX"],
        "cta": ["Futures", "FX", "Commodities", "Rates"],
        "crypto_hf": ["Crypto spot", "Crypto perps", "Crypto options"],
        "options": ["Equity options", "Index options"],
        "vol_trading": ["Volatility", "Options"],
        "quant_hf": ["Equities", "Futures", "Multi-asset"],
        "systematic_hf": ["Equities", "Futures", "Multi-asset"],
        "macro_quant": ["Rates", "FX", "Equities", "Commodities"],
        "prop": ["Equities", "Options", "ETFs", "Futures"],
        "multi_strat": ["Multi-asset"],
        "open_source": ["Research / multi"],
        "trading_bot": ["Crypto / research"],
        "academic": ["Research"],
        "ml_trading": ["Equities", "Multi-asset"],
        "alt_data": ["Equities research data"],
        "algo_company": ["Sell-side / multi"],
        "stat_arb": ["Equities"],
        "indie_trader": ["Equities", "Futures"],
    }

    for seed in iter_organization_seeds():
        oid = "org_" + slugify(seed["name"])
        founded = seed["founded_year"]
        longevity = None
        longevity_status = "UNKNOWN"
        if isinstance(founded, int):
            longevity = max(0, 2026 - founded)
            longevity_status = "INFERRED"
        org = {
            "id": oid,
            "name": seed["name"],
            "aliases": [],
            "org_type": seed["org_type"],
            "founded_year": founded if founded is not None else "UNKNOWN",
            "headquarters": seed["headquarters"] if seed["headquarters"] != "UNKNOWN" else "UNKNOWN",
            "aum_usd": pv(),
            "markets": markets_by_type.get(seed["org_type"], ["UNKNOWN"]),
            "strategy_ids": [],
            "automation_level": "UNKNOWN",
            "longevity_years": pv(longevity, longevity_status) if longevity is not None else pv(),
            "known_for": known_for_map.get(seed["name"], "UNKNOWN"),
            "discovery_tier": seed["discovery_tier"],
            "notes": "Seeded from public knowledge catalogs; performance UNKNOWN unless later linked",
            "source_ids": ["src_ssrn_quant_general"],
        }
        # Heuristic automation
        if seed["org_type"] in {"hft", "market_maker", "quant_hf", "systematic_hf", "cta", "trading_bot", "open_source", "ml_trading"}:
            org["automation_level"] = 9 if seed["org_type"] in {"hft", "market_maker"} else 8
        elif seed["org_type"] in {"multi_strat", "prop", "options", "vol_trading", "crypto_hf"}:
            org["automation_level"] = 6
        orgs.append(org)
    return orgs


def build_strategies(orgs: list[dict]) -> list[dict]:
    org_ids = {o["id"] for o in orgs}
    strategies = []

    for s in STRATEGIES:
        s = dict(s)
        s["organization_ids"] = [oid for oid in s.get("organization_ids", []) if oid in org_ids]
        s["ranking_scores"] = compute_all_ranking_scores(s)
        strategies.append(s)

    # Expand templates
    for sid, name, cats, market, edge, interest in more_strategy_templates():
        sid = sid.replace(" ", "")
        if any(x["id"] == sid for x in strategies):
            continue
        # Attach organizations loosely by keyword overlap with strategy name/categories
        linked = []
        lname = name.lower()
        catstr = " ".join(cats).lower() if isinstance(cats, list) else str(cats).lower()
        tokens = [
            "aqr",
            "ahl",
            "winton",
            "aspect",
            "transtrend",
            "virtu",
            "jane street",
            "jump",
            "hudson river",
            "xtx",
            "two sigma",
            "renaissance",
            "bridgewater",
            "citadel",
            "man group",
            "optiver",
            "hummingbot",
            "numerai",
            "worldquant",
        ]
        for o in orgs:
            on = o["name"].lower()
            for tok in tokens:
                if tok in on and (tok in lname or any(t in catstr for t in tok.split())):
                    linked.append(o["id"])
                    break
            if len(linked) >= 3:
                break

        evidence = "STRONGLY_SUPPORTED" if interest >= 70 else "INFERRED"
        repro = 75 if "public" in name.lower() or "replication" in name.lower() or "factor" in name.lower() or "trend" in name.lower() or "momentum" in name.lower() or "carry" in name.lower() else 40
        if any(x in name.lower() for x in ["hft", "ml market", "medallion", "citadel", "renaissance"]):
            repro = 12
        if any(x in name.lower() for x in ["finrl", "deep rl", "triangular"]):
            repro = 55
            evidence = "SPECULATIVE" if "triangular" in name.lower() or "finrl" in name.lower() else evidence

        strat = {
            "id": sid,
            "name": name,
            "organization_ids": linked[:5],
            "categories": cats if isinstance(cats, list) else [cats],
            "market": market,
            "asset_class": market,
            "timeframe": "days",
            "core_edge": edge,
            "signal": ptext(f"Public literature characterizes primary signal family for: {name}", evidence),
            "entry": ptext("See public papers/code where available; otherwise UNKNOWN proprietary details", evidence),
            "exit": ptext("Regime-/signal-dependent exits per public descriptions", "INFERRED"),
            "position_sizing": ptext("Often volatility-scaled in systematic implementations", "INFERRED"),
            "risk_management": ptext("Drawdown limits / diversification; specifics vary", "INFERRED"),
            "hedging": ptext("Strategy-dependent", "UNKNOWN"),
            "execution": ptext("Varies from daily rebalance to low-latency", "INFERRED"),
            "automation": ptext("Typically systematizable if rules-based", "INFERRED"),
            "data_requirements": ptext("Market data appropriate to asset class; alt-data if noted", "INFERRED"),
            "performance": empty_performance(),
            "edge_score": min(95, max(20, interest - 5)),
            "quality_score": min(90, max(25, interest - 10)),
            "reproducibility_score": repro,
            "implementation_difficulty": 10 - min(9, repro // 10),
            "regime_dependency_score": 55,
            "evidence_level": evidence,
            "public_sources": ["src_ssrn_quant_general", "src_arxiv_qfin"],
            "research_interest": interest,
        }
        # Timeframe heuristics
        if "High frequency" in cats or "hft" in name.lower():
            strat["timeframe"] = "hft"
        elif "Trend" in str(cats) or "Momentum" in str(cats):
            strat["timeframe"] = "weeks"
        elif "Market making" in cats:
            strat["timeframe"] = "seconds"

        strat["ranking_scores"] = compute_all_ranking_scores(strat)
        strategies.append(strat)

    # Link strategies back to orgs
    by_id = {o["id"]: o for o in orgs}
    for s in strategies:
        for oid in s.get("organization_ids", []):
            if oid in by_id and s["id"] not in by_id[oid]["strategy_ids"]:
                by_id[oid]["strategy_ids"].append(s["id"])

    return strategies


def build_bots() -> list[dict]:
    bots = list(BOTS)
    existing = {b["id"] for b in bots}
    for bid, name, url, lang, market in extra_bot_stubs():
        if bid in existing:
            continue
        bots.append(
            {
                "id": bid,
                "name": name,
                "source_url": url,
                "language": lang,
                "market": market,
                "timeframe": "UNKNOWN",
                "strategy_id": None,
                "signals": "UNKNOWN — requires repo-specific inspection",
                "entry": "UNKNOWN",
                "exit": "UNKNOWN",
                "position_sizing": "UNKNOWN",
                "risk_management": "UNKNOWN",
                "execution": "UNKNOWN",
                "data": "UNKNOWN",
                "backtest_notes": "Not deeply inspected in this build; listed for discovery universe breadth",
                "performance": empty_performance(),
                "limitations": "Evidence incomplete until code/docs inspected",
                "code_inspected": False,
                "inspection_summary": "UNKNOWN",
            }
        )
    return bots


def build_reconstructions(strategies: list[dict]) -> list[dict]:
    """Phase 9 maps for high-value strategies."""
    out = []
    # Prefer top by research interest
    ranked = sorted(strategies, key=lambda s: s.get("research_interest") or 0, reverse=True)
    for s in ranked[:60]:
        ev = s.get("evidence_level", "INFERRED")
        label = {
            "CONFIRMED": "CONFIRMED",
            "STRONGLY_SUPPORTED": "STRONGLY_SUPPORTED",
            "INFERRED": "INFERRED",
            "SPECULATIVE": "SPECULATIVE",
            "UNKNOWN": "SPECULATIVE",
        }.get(ev, "INFERRED")
        out.append(
            {
                "strategy_id": s["id"],
                "name": s["name"],
                "pipeline": [
                    {"stage": "DATA", "detail": s.get("data_requirements", {}).get("text"), "evidence": label},
                    {"stage": "DATA_CLEANING", "detail": "Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)", "evidence": "INFERRED"},
                    {"stage": "FEATURE_ENGINEERING", "detail": s.get("signal", {}).get("text"), "evidence": label},
                    {"stage": "SIGNAL_GENERATION", "detail": s.get("signal", {}).get("text"), "evidence": label},
                    {"stage": "PROBABILITY_OR_EXPECTED_RETURN", "detail": "Map features to expected return / edge estimate after costs", "evidence": "INFERRED"},
                    {"stage": "TRADE_FILTER", "detail": "Liquidity, borrow, news halts, risk budget filters", "evidence": "INFERRED"},
                    {"stage": "POSITION_SIZING", "detail": s.get("position_sizing", {}).get("text"), "evidence": s.get("position_sizing", {}).get("evidence", "INFERRED")},
                    {"stage": "EXECUTION", "detail": s.get("execution", {}).get("text"), "evidence": s.get("execution", {}).get("evidence", "INFERRED")},
                    {"stage": "RISK_MANAGEMENT", "detail": s.get("risk_management", {}).get("text"), "evidence": s.get("risk_management", {}).get("evidence", "INFERRED")},
                    {"stage": "EXIT", "detail": s.get("exit", {}).get("text"), "evidence": s.get("exit", {}).get("evidence", "INFERRED")},
                    {"stage": "PORTFOLIO_MANAGEMENT", "detail": s.get("hedging", {}).get("text"), "evidence": s.get("hedging", {}).get("evidence", "INFERRED")},
                ],
                "notes": "Traffic-light evidence labels follow project rules; SPECULATIVE must not be treated as fact.",
            }
        )
    return out


def build_failures(strategies: list[dict], bots: list[dict]) -> dict:
    avoid = []
    # Heuristic weak-evidence flags
    for s in strategies:
        reasons = []
        if s.get("evidence_level") in {"SPECULATIVE", "UNKNOWN"}:
            reasons.append("Weak evidence level")
        if (s.get("reproducibility_score") or 0) >= 50 and (s.get("quality_score") or 0) < 45:
            reasons.append("Reproducible toy with weak quality score")
        name = s.get("name", "").lower()
        if any(k in name for k in ["finrl", "deep rl", "triangular", "sentiment toy", "spac arb", "latency arb historical"]):
            reasons.append("Historically crowded / fragile / research-only patterns")
        if "short vol" in name or "short volatility" in name:
            reasons.append("Tail-risk asymmetry; crash regimes dominate")
        if reasons:
            avoid.append(
                {
                    "strategy_id": s["id"],
                    "name": s["name"],
                    "reasons": reasons,
                    "failure_modes": [
                        "Backtest-only evidence risk",
                        "Overfitting / hyperparameter search abuse",
                        "Ignored fees and slippage",
                        "Survivorship / look-ahead bias risk",
                        "Regime dependence / crowding",
                    ],
                    "verdict": "STRATEGIES TO AVOID until stronger out-of-sample and cost-aware evidence",
                }
            )

    # Famous failure organizations as case studies
    case_studies = [
        {
            "id": "fail_alameda",
            "name": "Alameda Research (historical)",
            "lesson": "Opaque risk, correlated crypto basis/lending exposures, and governance failures — not a model to replicate",
            "evidence_level": "CONFIRMED",
        },
        {
            "id": "fail_3ac",
            "name": "Three Arrows Capital (historical)",
            "lesson": "Leverage + illiquid venture-like crypto bets + basis trades can fail violently in liquidity shocks",
            "evidence_level": "CONFIRMED",
        },
        {
            "id": "fail_xiv",
            "name": "Short-vol ETP structures (XIV-style)",
            "lesson": "Harvesting vol premium via products with convex liability can terminate in a single shock",
            "evidence_level": "CONFIRMED",
        },
        {
            "id": "fail_ltcm_lineage_lesson",
            "name": "LTCM-style relative value leverage lesson (historical)",
            "lesson": "High Sharpe RV with huge leverage fails when liquidity and correlations regime-shift",
            "evidence_level": "STRONGLY_SUPPORTED",
        },
    ]

    bot_warnings = [
        {
            "bot_id": b["id"],
            "name": b["name"],
            "warning": "Public bot frameworks are not evidence of alpha; most shared strategies are overfit or cost-naive",
        }
        for b in bots
        if b["id"] in {"bot_freqtrade", "bot_gekko", "bot_zenbot", "bot_finrl", "bot_tensortrade"}
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "strategies_to_avoid": avoid[:80],
        "historical_failure_case_studies": case_studies,
        "bot_framework_warnings": bot_warnings,
    }


def build_hypotheses() -> list[dict]:
    """30 research hypotheses — NOT claimed fund strategies."""
    combos = [
        ("Hyp-01", ["Cross-sectional momentum", "Volatility filter", "Dynamic vol targeting"], "Reduce momentum-crash exposure while keeping factor premium"),
        ("Hyp-02", ["Time-series trend", "FX carry", "Correlation-aware risk parity"], "Combine crisis-alpha trend with carry; size by cov risk"),
        ("Hyp-03", ["Value", "Momentum", "Quality"], "Classic multi-factor diversification of style drawdowns"),
        ("Hyp-04", ["Pairs mean reversion", "Hard-to-borrow filter", "TCA cost model"], "Only trade residual dislocations that survive costs and borrow"),
        ("Hyp-05", ["ETF arb", "Intraday momentum overlay", "Inventory skew"], "MM inventory mean reversion plus short-horizon signal"),
        ("Hyp-06", ["VRP harvest", "Trend-on-vol filter", "Tail hedge budget"], "Take vol premium only when vol trend not exploding; hard-cap tail budget"),
        ("Hyp-07", ["Commodity curve carry", "TSMOM", "Seasonality filter"], "Curve shape + trend confirmation"),
        ("Hyp-08", ["PEAD", "Options skew confirmation", "Liquidity filter"], "Event drift with options-market confirmation"),
        ("Hyp-09", ["Crypto funding harvest", "Basis cash-and-carry", "Exchange credit limits"], "Structural crypto carry with venue risk controls"),
        ("Hyp-10", ["Stat arb residuals", "Meta-labeling", "Position sizing by probability"], "AFML-style secondary model filters primary signal"),
        ("Hyp-11", ["Defensive equity", "Trend overlay on index hedge", "Vol targeting"], "Keep low-vol sleeve; hedge when index trend breaks"),
        ("Hyp-12", ["Merger arb", "Deal-break probability model", "Portfolio deal-correlation cap"], "Improve sizing beyond naive spread capture"),
        ("Hyp-13", ["Index rebalance", "Advancement timing model", "Borrow/liquidity constraints"], "Event microstructure with realistic capacity"),
        ("Hyp-14", ["Alt-data nowcast", "Earnings surprise model", "Short holding period"], "Data edge only if lead time > implementation lag"),
        ("Hyp-15", ["News NLP", "Liquidity/impact model", "Kill-switch on rumor quality"], "Information edge with toxicity controls"),
        ("Hyp-16", ["Dispersion trading", "Correlation regime detector", "Single-name jump filters"], "Vol RV only when correlation premium justified"),
        ("Hyp-17", ["FI relative value", "PCA residual trading", "Funding stress overlay"], "RV with liquidity-stress off switch"),
        ("Hyp-18", ["Turtle-style breakout", "ATR sizing", "Long-only constraint for capacity"], "Public trend rules with modern risk overlays"),
        ("Hyp-19", ["Dual momentum", "Crash protection SMA", "Multi-asset universe"], "Retail-reproducible absolute+relative momentum"),
        ("Hyp-20", ["Clenow equity momentum", "Sector neutrality", "Gap-risk skip rules"], "Improve equity momentum implementability"),
        ("Hyp-21", ["Carver multi-instrument trend", "Carry overlay", "IDM diversification multiplier"], "Public systematic futures stack"),
        ("Hyp-22", ["Avellaneda-Stoikov MM", "Toxicity filter", "Venue selection"], "Academic MM with adverse-selection defense"),
        ("Hyp-23", ["Cross-exchange crypto arb", "Latency budget realism", "Withdrawal/credit risk model"], "Only if ops risk priced correctly"),
        ("Hyp-24", ["Qlib-style ML alpha", "Purged CV", "Cost-aware portfolio"], "Industrial ML workflow with leakage defenses"),
        ("Hyp-25", ["Numerai-like ensemble", "Neutralization constraints", "Slow turnover"], "Crowdsourced features with institutional portfolio rules"),
        ("Hyp-26", ["Risk premia stack", "Dynamic allocation by Sharpe trailing", "Max strategy correlation"], "Allocate across premia by recent risk-adj performance carefully"),
        ("Hyp-27", ["Opening range breakout", "Session vol regime filter", "No-trade around news"], "Intraday breakout with event avoidance"),
        ("Hyp-28", ["Post-FOMC drift", "Rates TSMOM", "Equity-bond correlation monitor"], "Macro event + trend hybrid"),
        ("Hyp-29", ["Short interest crowding", "Momentum fade", "Squeeze risk cap"], "Crowding as risk overlay not alpha toy"),
        ("Hyp-30", ["HMM regime detection", "Strategy switching between trend and MR", "Transition cost penalty"], "Regime-conditional strategy allocation hypothesis"),
    ]
    out = []
    for hid, parts, why in combos:
        out.append(
            {
                "id": hid,
                "title": " + ".join(parts),
                "components": parts,
                "why_complementary": why,
                "potential_advantages": [
                    "Diversification across failure modes of single styles",
                    "Explicit risk overlays may improve drawdown profile",
                ],
                "potential_weaknesses": [
                    "Overfitting combination rules",
                    "Correlated breakdown in liquidity crises",
                    "Capacity and cost drag may erase paper edge",
                ],
                "expected_market_regime": "UNKNOWN — must be tested across regimes; do not assume universality",
                "data_requirements": "Point-in-time market data + costs + borrow/funding where relevant",
                "backtesting_requirements": [
                    "Purged / embargoed cross-validation where ML used",
                    "Realistic fees, slippage, latency",
                    "Crisis period stress tests",
                    "Capacity / ADV constraints",
                ],
                "status": "RESEARCH_HYPOTHESIS",
                "disclaimer": "Not a claim that any fund uses this combination; not a guarantee of profitability",
            }
        )
    return out


def build_deep_research(strategies: list[dict], top100: list[dict]) -> list[dict]:
    top_ids = [t["strategy_id"] for t in top100[:50]]
    by_id = {s["id"]: s for s in strategies}
    deep = []
    for sid in top_ids:
        s = by_id.get(sid)
        if not s:
            continue
        deep.append(
            {
                "strategy_id": sid,
                "name": s["name"],
                "original_source": (s.get("public_sources") or [None])[0],
                "earliest_documentation": "See linked public_sources; exact first appearance may be UNKNOWN",
                "independent_research": "Seek arXiv/SSRN replications; mark CONFIRMED only with citations",
                "academic_validation": s.get("evidence_level"),
                "real_world_implementation": "Linked organizations where IDs present; implementation details often proprietary",
                "historical_performance": s.get("performance"),
                "known_failures": [
                    "Momentum crashes / carry crashes / vol explosions depending on style",
                    "Crowding and fee compression",
                ],
                "known_limitations": [
                    "Transaction costs",
                    "Slippage",
                    "Capacity",
                    "Regime dependence",
                ],
                "crowding": "UNKNOWN to ESTIMATED high for well-known factors",
                "capacity": "UNKNOWN",
                "market_regime_dependence": s.get("regime_dependency_score"),
                "transaction_costs": "Must be modeled; UNKNOWN impact without specific market/timeframe study",
                "slippage": "Critical for HFT/MM; material for daily stat arb",
                "survivorship_bias": "High risk in fund databases and retail bot leaderboards",
                "look_ahead_bias": "High risk in fundamental and alt-data pipelines",
                "overfitting": "High risk in ML and hyperopt bot strategies",
                "data_mining": "High risk when searching large alpha libraries without strict OOS",
                "second_pass_notes": (
                    "Deep pass emphasizes bias checklist over flashy returns. "
                    "Prefer strategies with multi-decade academic+industry corroboration "
                    "and transparent reconstruction paths."
                ),
                "edge_score": s.get("edge_score"),
                "quality_score": s.get("quality_score"),
                "reproducibility_score": s.get("reproducibility_score"),
                "evidence_level": s.get("evidence_level"),
            }
        )
    return deep


def meta(count: int, label: str) -> dict:
    return {
        "project": "hedge-fund-alpha-atlas",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "record_count": count,
        "label": label,
        "rules": [
            "Never invent performance numbers",
            "UNKNOWN when unavailable",
            "ESTIMATED/INFERRED only when labeled",
            "Public sources only",
        ],
    }


def main() -> None:
    orgs = build_organizations()
    strategies = build_strategies(orgs)
    bots = build_bots()
    sources = SOURCES

    write_json(
        "01_hedge_fund_database.json",
        {"meta": meta(len(orgs), "organizations"), "organizations": orgs, "sources_index": [s["id"] for s in sources]},
    )
    write_json(
        "02_strategy_database.json",
        {"meta": meta(len(strategies), "strategies"), "strategies": strategies},
    )
    write_json(
        "03_trading_bot_database.json",
        {"meta": meta(len(bots), "trading_bots"), "bots": bots},
    )

    top100 = build_top_100(strategies)
    write_json(
        "04_top_100_strategies.json",
        {"meta": meta(len(top100), "top_100"), "rankings_defined": list("ABCDEFGHIJ"), "top_100": top100},
    )

    deep = build_deep_research(strategies, top100)
    write_json(
        "05_top_50_deep_research.json",
        {"meta": meta(len(deep), "top_50_deep_research"), "deep_research": deep},
    )

    recon = build_reconstructions(strategies)
    write_json(
        "06_strategy_reconstruction.json",
        {"meta": meta(len(recon), "strategy_reconstruction"), "reconstructions": recon},
    )

    failures = build_failures(strategies, bots)
    write_json("07_strategy_failures.json", failures)

    hyps = build_hypotheses()
    write_json(
        "08_research_hypotheses.json",
        {"meta": meta(len(hyps), "research_hypotheses"), "hypotheses": hyps},
    )

    write_json(
        "00_sources.json",
        {"meta": meta(len(sources), "sources"), "sources": sources},
    )

    # Cross-strategy pattern summary
    from collections import Counter

    cat_counts = Counter()
    edge_counts = Counter()
    for s in strategies:
        for c in s.get("categories") or []:
            cat_counts[c] += 1
        edge_counts[s.get("core_edge") or "UNKNOWN"] += 1

    write_json(
        "09_cross_strategy_patterns.json",
        {
            "meta": meta(len(strategies), "cross_strategy_patterns"),
            "most_frequent_categories": cat_counts.most_common(20),
            "most_frequent_edges": edge_counts.most_common(20),
            "highest_reproducibility": sorted(
                [
                    {"id": s["id"], "name": s["name"], "reproducibility_score": s.get("reproducibility_score")}
                    for s in strategies
                ],
                key=lambda x: x["reproducibility_score"] or 0,
                reverse=True,
            )[:25],
            "highest_edge": sorted(
                [
                    {"id": s["id"], "name": s["name"], "edge_score": s.get("edge_score"), "reproducibility_score": s.get("reproducibility_score")}
                    for s in strategies
                ],
                key=lambda x: x["edge_score"] or 0,
                reverse=True,
            )[:25],
            "notes": [
                "Frequent ≠ profitable",
                "High edge score with low reproducibility implies research interest without easy implementation",
            ],
        },
    )

    print(
        f"Done. orgs={len(orgs)} strategies={len(strategies)} bots={len(bots)} "
        f"top100={len(top100)} deep={len(deep)} hyps={len(hyps)}"
    )


if __name__ == "__main__":
    main()
