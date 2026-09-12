#!/usr/bin/env python3
"""Generate Markdown reports: strategy cards + Hedge Fund Alpha Atlas."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "databases"
REPORTS = ROOT / "reports"
CARDS = REPORTS / "strategy_cards"
DEEP = REPORTS / "deep_research"


def load(name: str):
    return json.loads((DB / name).read_text(encoding="utf-8"))


def evid_icon(level: str) -> str:
    return {
        "CONFIRMED": "🟢 CONFIRMED",
        "STRONGLY_SUPPORTED": "🟡 STRONGLY SUPPORTED",
        "INFERRED": "🟠 INFERRED",
        "ESTIMATED": "🟠 ESTIMATED",
        "SPECULATIVE": "🔴 SPECULATIVE",
        "UNKNOWN": "🔴 UNKNOWN",
    }.get(level, level)


def pv_fmt(pv: dict | None) -> str:
    if not pv:
        return "UNKNOWN"
    if pv.get("status") == "UNKNOWN" or pv.get("value") is None:
        note = pv.get("note")
        return f"UNKNOWN{(' — ' + note) if note else ''}"
    return f"{pv.get('value')} ({pv.get('status')})"


def write_strategy_card(s: dict, path: Path) -> None:
    perf = s.get("performance") or {}
    lines = [
        f"# STRATEGY CARD — {s['name']}",
        "",
        f"**STRATEGY:** {s['name']}",
        f"**SOURCE:** {', '.join(s.get('public_sources') or []) or 'UNKNOWN'}",
        f"**FUND / TRADER:** {', '.join(s.get('organization_ids') or []) or 'UNKNOWN'}",
        "",
        f"**MARKET:** {s.get('market')}",
        f"**ASSET CLASS:** {s.get('asset_class')}",
        f"**TIMEFRAME:** {s.get('timeframe')}",
        f"**STRATEGY TYPE:** {', '.join(s.get('categories') or [])}",
        f"**CORE EDGE:** {s.get('core_edge')}",
        "",
        f"**DATA:** {(s.get('data_requirements') or {}).get('text', 'UNKNOWN')}",
        f"**SIGNAL:** {(s.get('signal') or {}).get('text', 'UNKNOWN')}",
        f"**ENTRY:** {(s.get('entry') or {}).get('text', 'UNKNOWN')}",
        f"**EXIT:** {(s.get('exit') or {}).get('text', 'UNKNOWN')}",
        f"**POSITION SIZING:** {(s.get('position_sizing') or {}).get('text', 'UNKNOWN')}",
        f"**RISK MANAGEMENT:** {(s.get('risk_management') or {}).get('text', 'UNKNOWN')}",
        f"**HEDGING:** {(s.get('hedging') or {}).get('text', 'UNKNOWN')}",
        f"**EXECUTION:** {(s.get('execution') or {}).get('text', 'UNKNOWN')}",
        f"**AUTOMATION:** {(s.get('automation') or {}).get('text', 'UNKNOWN')}",
        "",
        f"**HISTORICAL PERFORMANCE:** see fields below (never fabricated)",
        f"**SHARPE:** {pv_fmt(perf.get('sharpe'))}",
        f"**SORTINO:** {pv_fmt(perf.get('sortino'))}",
        f"**MAX DRAWDOWN:** {pv_fmt(perf.get('max_drawdown'))}",
        f"**WIN RATE:** {pv_fmt(perf.get('win_rate'))}",
        "",
        f"**EDGE SCORE:** {s.get('edge_score')}/100",
        f"**STRATEGY QUALITY SCORE:** {s.get('quality_score')}/100",
        f"**REPRODUCIBILITY SCORE:** {s.get('reproducibility_score')}/100",
        f"**IMPLEMENTATION DIFFICULTY:** {s.get('implementation_difficulty')}/10",
        f"**REGIME DEPENDENCY SCORE:** {s.get('regime_dependency_score')}/100",
        f"**EVIDENCE LEVEL:** {evid_icon(s.get('evidence_level', 'UNKNOWN'))}",
        "",
        f"**PUBLIC SOURCES:** {', '.join(s.get('public_sources') or [])}",
        "",
        "---",
        "",
        "_Not investment advice. Public-information research only._",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def build_atlas(
    orgs: list[dict],
    strategies: list[dict],
    bots: list[dict],
    top100: list[dict],
    deep: list[dict],
    failures: dict,
    hyps: list[dict],
    patterns: dict,
) -> str:
    by_id = {s["id"]: s for s in strategies}
    top_repro = patterns.get("highest_reproducibility") or []
    top_edge = patterns.get("highest_edge") or []

    famous = [o for o in orgs if o.get("discovery_tier") == "famous"]
    open_source = [o for o in orgs if o.get("discovery_tier") == "open_source"]
    inspected_bots = [b for b in bots if b.get("code_inspected")]

    lines = []
    a = lines.append

    a("# THE HEDGE FUND ALPHA ATLAS")
    a("")
    a("**Hedge Fund Intelligence & Strategy Research Platform — Final Report**")
    a("")
    a(f"_Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}_")
    a("")
    a("> Public information only. No proprietary claims. Missing data is labeled UNKNOWN.")
    a("> This project is standalone and not connected to any trading product or prior application.")
    a("")
    a("---")
    a("")
    a("## Executive Verdict")
    a("")
    a("The strongest **publicly documented** edges are not the mysterious private books of elite HFT firms — those score high on interest but near-zero on reproducibility. The strategies with the best **evidence × persistence × reconstructability** profile are:")
    a("")
    a("1. **Time-series trend following (CTA / TSMOM)** — multi-decade academic + industry corroboration; highly automatable; crisis-alpha narrative with known whipsaw costs.")
    a("2. **Cross-sectional equity momentum** — classic factor with CONFIRMED mechanics; known crash regimes.")
    a("3. **Multi-asset risk premia stacks** (value/momentum/carry/quality + vol targeting) — diversified factor exposure with transparent construction.")
    a("4. **Market making / HFT liquidity provision** — clearly profitable for specialized firms (Virtu filings, industry structure) but **not** independently reconstructable without speed, colocations, and toxic-flow defense.")
    a("5. **Medallion-style short-horizon ensembles** — among the highest inferred quality in public lore, but internals are UNKNOWN; treat as research inspiration, not a blueprint.")
    a("")
    a("---")
    a("")
    a("## Research Universe Snapshot")
    a("")
    a(f"| Dataset | Count |")
    a(f"|---------|------:|")
    a(f"| Organizations / traders / systems | {len(orgs)} |")
    a(f"| Strategies | {len(strategies)} |")
    a(f"| Trading bots / OSS systems | {len(bots)} |")
    a(f"| Top 100 ranked strategies | {len(top100)} |")
    a(f"| Top 50 deep-research dossiers | {len(deep)} |")
    a(f"| Research hypotheses | {len(hyps)} |")
    a(f"| Famous-tier organizations | {len(famous)} |")
    a(f"| Open-source ecosystem entities | {len(open_source)} |")
    a(f"| Bots with code inspection notes | {len(inspected_bots)} |")
    a("")
    a("Discovery spans quant hedge funds, CTAs, prop/HFT/market makers, crypto desks, academic labs, alt-data firms, indie systematic traders, and public bot frameworks.")
    a("")
    a("---")
    a("")
    a("## Who Appears Most Successful?")
    a("")
    a("### By public reputation / longevity (not a Sharpe ranking)")
    a("")
    a("| Organization | Why they appear in the success set | Evidence caveat |")
    a("|--------------|------------------------------------|-----------------|")
    a("| Renaissance Technologies (Medallion) | Multi-decade extraordinary reputation in public books/press | Exact net returns/Sharpe not treated as CONFIRMED here without primary investor docs |")
    a("| Citadel / Citadel Securities | Multi-strategy + market-making franchise scale | Strategy-level attribution UNKNOWN |")
    a("| Jane Street | Persistent prop profitability narrative; ETF/RV strength | Private partnership; limited public return series |")
    a("| Jump / HRT / Tower / XTX | Enduring HFT/MM franchises | Edge is speed+models+ops; not public recipes |")
    a("| Virtu Financial | Public filings show electronic trading economics | Firm-level, not strategy-card Sharpe |")
    a("| AQR / Man AHL / Winton / Aspect / Transtrend | Long-lived systematic factor/CTA businesses | Returns vary by product/era; crowding & costs matter |")
    a("| D.E. Shaw / Two Sigma / PDT / Cubist / WorldQuant | Durable quant platforms | Internals mostly UNKNOWN |")
    a("")
    a("**Important:** High firm success ≠ a single publicly reconstructable strategy.")
    a("")
    a("---")
    a("")
    a("## Which Strategies Have the Strongest Evidence?")
    a("")
    a("Strategies labeled **CONFIRMED** with transparent mechanics:")
    a("")
    confirmed = [s for s in strategies if s.get("evidence_level") == "CONFIRMED"]
    for s in sorted(confirmed, key=lambda x: x.get("quality_score") or 0, reverse=True)[:15]:
        a(f"- **{s['name']}** — quality {s.get('quality_score')}/100, reproducibility {s.get('reproducibility_score')}/100")
    a("")
    a("---")
    a("")
    a("## Which Strategies Survived the Longest?")
    a("")
    a("Publicly long-lived families (decades):")
    a("")
    a("- Trend following / managed futures")
    a("- Cross-sectional momentum and value factor investing")
    a("- Merger arbitrage")
    a("- Convertible arb (survived but with major crisis scars)")
    a("- FX carry (survived with known crash risk)")
    a("- Equity/ETF market making as a business model")
    a("")
    a("Longevity here means *strategy family survival*, not uninterrupted high Sharpe.")
    a("")
    a("---")
    a("")
    a("## Risk-Adjusted Return View")
    a("")
    a("Because most proprietary funds do not publish strategy-level Sharpe/Sortino series suitable for CONFIRMED ingestion, this Atlas **refuses to fabricate** Rankings C/D leaders from rumor.")
    a("")
    a("Where ESTIMATED academic/industry ranges exist, they are labeled as such in strategy cards (e.g., factor Sharpe bands ~0.3–0.7 pre-cost depending on sample).")
    a("")
    a("For reconstructable research, prefer:")
    a("")
    a("- Strategies with published factor portfolios / futures trend specifications")
    a("- Cost-aware replications")
    a("- Explicit drawdown and crash-period analysis")
    a("")
    a("---")
    a("")
    a("## Top 100 (Composite Research Ranking)")
    a("")
    a("Composite emphasizes research interest, reproducibility, consistency proxy, and risk-adjusted quality — **not** raw return myths.")
    a("")
    a("| Rank | Strategy | Composite | Evidence | Repro | Edge |")
    a("|-----:|----------|----------:|----------|------:|-----:|")
    for t in top100[:40]:
        a(
            f"| {t['rank']} | {t['name']} | {t['composite_score']} | {t['evidence_level']} | "
            f"{t.get('reproducibility_score')} | {t.get('edge_score')} |"
        )
    a("")
    a(f"_Full Top 100 table: `databases/04_top_100_strategies.json` (showing 40/{len(top100)} here)._")
    a("")
    a("---")
    a("")
    a("## Automation")
    a("")
    a("Highly automated families:")
    a("")
    a("- HFT / electronic market making")
    a("- CTA trend systems")
    a("- Factor rebalance engines")
    a("- Crypto MM bots (Hummingbot et al.) — automation ≠ edge")
    a("- Quant ML platforms (Qlib/Lean/Zipline) — research automation")
    a("")
    a("Semi-automated / hybrid:")
    a("")
    a("- Merger arb, distressed, discretionary macro pods")
    a("- Many multi-strat pods with systematic overlays")
    a("")
    a("---")
    a("")
    a("## Public Implementations")
    a("")
    a("Code-inspected / framework-inspected systems in this build:")
    a("")
    for b in inspected_bots:
        a(f"- **{b['name']}** — `{b.get('source_url')}` — {b.get('inspection_summary', '')[:160]}...")
    a("")
    a("Highest reproducibility strategy families:")
    a("")
    for x in top_repro[:12]:
        a(f"- {x['name']} (repro {x.get('reproducibility_score')})")
    a("")
    a("---")
    a("")
    a("## What Can Realistically Be Reconstructed?")
    a("")
    a("| Tier | Examples | Realistic independent test? |")
    a("|------|----------|------------------------------|")
    a("| A — High | TSMOM, cross-sectional momentum, value/quality/carry factors, Turtle/Dual Momentum, Carver-style futures | Yes, with public data + cost models |")
    a("| B — Medium | Pairs/resid MR, merger arb approximations, VRP overlays, funding/basis crypto carry | Partial; needs careful microstructure/borrow/funding data |")
    a("| C — Low | Medallion ensembles, XTX/HRT/Jump secret sauce, pod-shop books | No — characterize only |")
    a("| D — Fragile toys | Naive triangular arb, unvalidated FinRL demos, hyperopt indicator spam | Reconstructable but usually not economically meaningful after costs |")
    a("")
    a("---")
    a("")
    a("## Primary Alpha Sources Observed (Cross-Strategy)")
    a("")
    a("Most frequent edge labels in the database:")
    a("")
    for edge, cnt in (patterns.get("most_frequent_edges") or [])[:12]:
        a(f"- **{edge}**: {cnt}")
    a("")
    a("Most frequent strategy categories:")
    a("")
    for cat, cnt in (patterns.get("most_frequent_categories") or [])[:15]:
        a(f"- **{cat}**: {cnt}")
    a("")
    a("Recurring risk-management patterns:")
    a("")
    a("- Volatility targeting / risk parity sizing")
    a("- Hard loss limits / kill switches (esp. HFT/MM)")
    a("- Factor / beta neutrality for residual strategies")
    a("- Diversification across markets and horizons")
    a("- Explicit crash overlays for carry, short-vol, and momentum")
    a("")
    a("---")
    a("")
    a("## Strategies To Avoid (Weak Evidence / Fragile)")
    a("")
    a("See `databases/07_strategy_failures.json`. Headline lessons:")
    a("")
    for cs in failures.get("historical_failure_case_studies") or []:
        a(f"- **{cs['name']}**: {cs['lesson']}")
    a("")
    a("Common failure diagnostics applied in-database:")
    a("")
    a("- Backtest-only claims")
    a("- Hyperopt/curve-fit indicator stacks")
    a("- Ignored fees/slippage/latency")
    a("- Leverage dependence")
    a("- Survivorship and look-ahead bias")
    a("- Short-vol convexity blindness")
    a("")
    a("---")
    a("")
    a("## Research Hypotheses (30 Combinations)")
    a("")
    a("These are **hypotheses**, not claims of fund usage or guaranteed alpha.")
    a("")
    for h in hyps[:15]:
        a(f"- **{h['id']}**: {h['title']} — {h['why_complementary']}")
    a("")
    a(f"_All {len(hyps)} hypotheses in `databases/08_research_hypotheses.json`._")
    a("")
    a("---")
    a("")
    a("## Investigate Further (Priority Queue)")
    a("")
    a("1. Cost-aware multi-asset TSMOM + carry + vol targeting (Hyp-02 / Hyp-21 class)")
    a("2. Momentum crash defenses (vol filters, risk overlays) on equity CS momentum")
    a("3. Residual stat-arb with meta-labeling and realistic short borrow")
    a("4. Crypto funding/basis with explicit exchange credit risk")
    a("5. Qlib-style ML alphas with purged CV + capacity constraints")
    a("6. Avellaneda-Stoikov MM with toxicity filters on liquid crypto venues (small size)")
    a("7. Merger-arb probability models vs naive spread capture")
    a("8. Independent Medallion *characterization* literature review (not replication fantasy)")
    a("")
    a("---")
    a("")
    a("## Method Notes")
    a("")
    a("- Rankings A–J computed in `src/scoring/rankings.py`")
    a("- UNKNOWN/ESTIMATED/INFERRED labels enforced in schema validation")
    a("- Recursive discovery: seed lists expanded across prop, crypto, Asia quant, academic, OSS")
    a("- Deep research dossiers prioritize bias checklists over marketing returns")
    a("")
    a("## Databases")
    a("")
    a("| ID | Path |")
    a("|----|------|")
    a("| 01 | `databases/01_hedge_fund_database.json` |")
    a("| 02 | `databases/02_strategy_database.json` |")
    a("| 03 | `databases/03_trading_bot_database.json` |")
    a("| 04 | `databases/04_top_100_strategies.json` |")
    a("| 05 | `databases/05_top_50_deep_research.json` |")
    a("| 06 | `databases/06_strategy_reconstruction.json` |")
    a("| 07 | `databases/07_strategy_failures.json` |")
    a("| 08 | `databases/08_research_hypotheses.json` |")
    a("")
    a("---")
    a("")
    a("## Disclaimer")
    a("")
    a("This Atlas is research documentation assembled from public materials and structured inference labels. It is **not** investment advice, **not** an offer to invest, and **not** a claim of access to proprietary fund code or non-public performance. Do your own due diligence; assume transaction costs, capacity, and regime shifts can eliminate apparent edges.")
    a("")
    return "\n".join(lines)


def main() -> None:
    CARDS.mkdir(parents=True, exist_ok=True)
    DEEP.mkdir(parents=True, exist_ok=True)

    orgs = load("01_hedge_fund_database.json")["organizations"]
    strategies = load("02_strategy_database.json")["strategies"]
    bots = load("03_trading_bot_database.json")["bots"]
    top100 = load("04_top_100_strategies.json")["top_100"]
    deep = load("05_top_50_deep_research.json")["deep_research"]
    failures = load("07_strategy_failures.json")
    hyps = load("08_research_hypotheses.json")["hypotheses"]
    patterns = load("09_cross_strategy_patterns.json")
    recon = load("06_strategy_reconstruction.json")["reconstructions"]

    by_id = {s["id"]: s for s in strategies}

    # Cards for top 50
    for t in top100[:50]:
        s = by_id.get(t["strategy_id"])
        if not s:
            continue
        fname = f"{t['rank']:02d}_{t['strategy_id']}.md"
        write_strategy_card(s, CARDS / fname)

    # Deep research memos
    for i, d in enumerate(deep, start=1):
        path = DEEP / f"{i:02d}_{d['strategy_id']}.md"
        body = [
            f"# Deep Research — {d['name']}",
            "",
            f"- Strategy ID: `{d['strategy_id']}`",
            f"- Evidence: {d.get('evidence_level')}",
            f"- Edge score: {d.get('edge_score')}",
            f"- Quality: {d.get('quality_score')}",
            f"- Reproducibility: {d.get('reproducibility_score')}",
            f"- Regime dependency: {d.get('market_regime_dependence')}",
            "",
            "## Bias & Fragility Checklist",
            "",
            f"- Crowding: {d.get('crowding')}",
            f"- Capacity: {d.get('capacity')}",
            f"- Transaction costs: {d.get('transaction_costs')}",
            f"- Slippage: {d.get('slippage')}",
            f"- Survivorship bias: {d.get('survivorship_bias')}",
            f"- Look-ahead bias: {d.get('look_ahead_bias')}",
            f"- Overfitting: {d.get('overfitting')}",
            f"- Data mining: {d.get('data_mining')}",
            "",
            "## Known Failures / Limitations",
            "",
        ]
        for x in d.get("known_failures") or []:
            body.append(f"- {x}")
        body.append("")
        for x in d.get("known_limitations") or []:
            body.append(f"- {x}")
        body.extend(["", "## Second-Pass Notes", "", d.get("second_pass_notes") or "", ""])
        path.write_text("\n".join(body), encoding="utf-8")

    # Reconstruction digest
    recon_path = REPORTS / "STRATEGY_RECONSTRUCTION.md"
    rlines = ["# Strategy Reconstruction Maps", ""]
    for r in recon[:25]:
        rlines.append(f"## {r['name']}")
        rlines.append("")
        for stage in r["pipeline"]:
            rlines.append(f"- **{stage['stage']}** [{evid_icon(stage['evidence'])}]: {stage['detail']}")
        rlines.append("")
    recon_path.write_text("\n".join(rlines), encoding="utf-8")

    atlas = build_atlas(orgs, strategies, bots, top100, deep, failures, hyps, patterns)
    atlas_path = REPORTS / "HEDGE_FUND_ALPHA_ATLAS.md"
    atlas_path.write_text(atlas, encoding="utf-8")
    print(f"Wrote {atlas_path}")
    print(f"Wrote {len(list(CARDS.glob('*.md')))} strategy cards")
    print(f"Wrote {len(list(DEEP.glob('*.md')))} deep research memos")
    print(f"Wrote {recon_path}")


if __name__ == "__main__":
    main()
