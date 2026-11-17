# Hedge Fund Alpha Atlas

**Standalone Hedge Fund Intelligence & Strategy Research Platform**

A completely independent research system for discovering, investigating, comparing, and reverse-engineering *publicly documented* hedge funds, quantitative funds, proprietary trading firms, algorithmic traders, and trading bots.

> **Scope boundary:** This project is NOT connected to PolyGram, Polymarket, or any existing trading application. It uses only public information.

## Mission

Answer: *What makes highly successful trading organizations profitable?* — with evidence, not speculation.

## Critical Research Rules

1. Never invent data
2. Never invent a strategy
3. Never claim proprietary knowledge
4. Clearly distinguish FACT / INFERRED / ESTIMATED / UNKNOWN / SPECULATIVE
5. Prefer primary sources
6. High return ≠ good strategy — always account for risk and drawdown
7. Search beyond famous funds

## Quick Start

```bash
cd hedge-fund-alpha-atlas
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Build / refresh all databases from curated research seeds
python scripts/build_all.py

# Run ranking & export pipelines
python scripts/rank_and_export.py

# Validate evidence labels and schema integrity
python scripts/validate_databases.py
```

## Project Layout

```
hedge-fund-alpha-atlas/
  ARCHITECTURE.md          Research system architecture
  DATA_MODEL.md            Entity / relationship model
  schema/                  JSON Schema definitions
  src/                     Python research engine
  data/                    Source notes & raw captures
  databases/               Canonical research databases (01–08)
  reports/                 Strategy cards, deep research, final atlas
  scripts/                 Build, rank, validate pipelines
```

## Output Databases

| ID | File | Contents |
|----|------|----------|
| 01 | `hedge_fund_database.json` | Organizations / traders / systems (≥300) |
| 02 | `strategy_database.json` | Documented strategies |
| 03 | `trading_bot_database.json` | Public bots & open-source systems |
| 04 | `top_100_strategies.json` | Multi-ranking Top 100 |
| 05 | `top_50_deep_research.json` | Deep investigation set |
| 06 | `strategy_reconstruction.json` | Pipeline maps with evidence labels |
| 07 | `strategy_failures.json` | Weak / avoid strategies |
| 08 | `research_hypotheses.json` | 30 combination hypotheses |

## Final Report

See [`reports/HEDGE_FUND_ALPHA_ATLAS.md`](reports/HEDGE_FUND_ALPHA_ATLAS.md).

## Evidence Labels

| Label | Meaning |
|-------|---------|
| `CONFIRMED` | Direct primary public source |
| `STRONGLY_SUPPORTED` | Multiple independent public sources |
| `INFERRED` | Calculated or reasonably deduced from public info |
| `ESTIMATED` | Explicitly an estimate |
| `UNKNOWN` | Not publicly available |
| `SPECULATIVE` | Plausible but weakly evidenced |

## License / Ethics

Research only. Public sources only. No proprietary reverse-engineering of closed systems beyond what is publicly disclosed. Not investment advice.
