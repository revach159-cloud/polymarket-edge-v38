# Data Model — Hedge Fund Alpha Atlas

## Core Entities

### Organization (`Fund` / firm / trader desk)

| Field | Type | Notes |
|-------|------|-------|
| id | string | Stable slug `org_*` |
| name | string | Legal / common name |
| aliases | string[] | Former names |
| org_type | enum | quant_hf, prop, hft, cta, crypto_hf, market_maker, indie_trader, academic, bot_project, other |
| founded_year | int\|UNKNOWN | |
| headquarters | string\|UNKNOWN | |
| aum_usd | ProvenanceValue | |
| strategy_ids | string[] | |
| markets | string[] | |
| automation_level | 0–10\|UNKNOWN | |
| longevity_years | ProvenanceValue | |
| notes | string | |
| source_ids | string[] | |

### Strategy

| Field | Type | Notes |
|-------|------|-------|
| id | string | `strat_*` |
| name | string | |
| organization_ids | string[] | May be empty for open strategies |
| categories | StrategyCategory[] | Phase 6 taxonomy |
| market | string | |
| asset_class | string | |
| timeframe | enum | hft…long_term |
| core_edge | EdgeCategory | |
| signal | ProvenanceText | |
| entry | ProvenanceText | |
| exit | ProvenanceText | |
| position_sizing | ProvenanceText | |
| risk_management | ProvenanceText | |
| hedging | ProvenanceText | |
| execution | ProvenanceText | |
| automation | ProvenanceText | |
| data_requirements | ProvenanceText | |
| performance | PerformanceBlock | |
| edge_score | 0–100 | |
| quality_score | 0–100 | |
| reproducibility_score | 0–100 | |
| implementation_difficulty | 0–10 | |
| regime_dependency_score | 0–100 | |
| evidence_level | EvidenceLevel | |
| public_sources | string[] | |

### TradingBot

| Field | Type | Notes |
|-------|------|-------|
| id | string | `bot_*` |
| name | string | |
| source_url | string | |
| language | string | |
| market | string | |
| timeframe | string | |
| strategy_id | string\|null | |
| signals | string | |
| entry / exit / sizing / risk / execution / data | string | |
| backtest_notes | string | |
| performance | PerformanceBlock | |
| limitations | string | |
| code_inspected | bool | |

### PerformanceBlock

All numeric fields are `ProvenanceValue`:

```
{ "value": number|null, "status": "CONFIRMED"|"ESTIMATED"|"INFERRED"|"UNKNOWN", "note": string|null }
```

Fields: return, annualized_return, sharpe, sortino, max_drawdown, volatility, aum, cagr, win_rate, years_operating, crisis_performance, consistency_note

### Source

| Field | Type |
|-------|------|
| id | string |
| title | string |
| url | string\|null |
| source_type | filing, paper, interview, presentation, github, blog, book, dataset, other |
| published_year | int\|UNKNOWN |
| reliability | 1–5 |

### ProvenanceText

```
{ "text": string, "evidence": "CONFIRMED"|"STRONGLY_SUPPORTED"|"INFERRED"|"SPECULATIVE"|"UNKNOWN" }
```

## Relationships

```
Organization ──< uses >── Strategy ──< generates >── Signal
     │                        │
     │                        ├── Market
     │                        ├── Performance
     │                        └── Source
     │
TradingBot ──< implements >── Strategy
Paper ──< documents >── Strategy | Organization
```

## Ranking Dimensions (A–J)

| Code | Name | Primary inputs |
|------|------|----------------|
| A | Absolute Return | annualized_return |
| B | Risk-Adjusted Return | return / vol or quality composite |
| C | Sharpe | sharpe |
| D | Sortino | sortino |
| E | Return / Drawdown | annualized_return / \|max_dd\| |
| F | Consistency | multi-year regularity notes + longevity |
| G | Longevity | years_operating |
| H | Strategy Reproducibility | reproducibility_score |
| I | Automation | automation_level |
| J | Research Interest | composite of edge, evidence, novelty, reproducibility |

## Strategy Categories (Phase 6)

Momentum, Trend following, Mean reversion, Statistical arbitrage, Pairs trading, Cross-sectional momentum, Relative value, Market making, Arbitrage, Volatility arbitrage, Convertible arbitrage, Merger arbitrage, Event driven, Macro, Carry, Basis trading, Funding arbitrage, Order-flow trading, Liquidity provision, Sentiment, News trading, Alternative data, Machine learning, Deep learning, Reinforcement learning, Options, Volatility, High frequency, Low frequency

## Edge Categories (Phase 10)

INFORMATION, SPEED, DATA, STATISTICAL, TECHNOLOGY, EXECUTION, LIQUIDITY, STRUCTURAL, BEHAVIORAL, PRICING, RISK_MANAGEMENT, PORTFOLIO_CONSTRUCTION
