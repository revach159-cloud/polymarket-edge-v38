# STRATEGY CARD — Pairs / Residual Mean-Reversion Stat Arb

**STRATEGY:** Pairs / Residual Mean-Reversion Stat Arb
**SOURCE:** src_gatev_pairs_trading, src_avellaneda_lee_statarb
**FUND / TRADER:** org_pdt_partners, org_cubist_systematic_strategies, org_millennium_management

**MARKET:** Equities
**ASSET CLASS:** Equity
**TIMEFRAME:** days
**STRATEGY TYPE:** Statistical arbitrage, Pairs trading, Mean reversion
**CORE EDGE:** STATISTICAL

**DATA:** Point-in-time fundamentals/prices, borrow, corporate actions.
**SIGNAL:** Cointegration / residual z-score vs peer basket or factor model; trade dislocations.
**ENTRY:** Enter when residual z-score exceeds entry threshold.
**EXIT:** Exit at mean reversion / time stop / stop-loss on residual.
**POSITION SIZING:** Dollar or beta neutrality; volatility-scaled legs.
**RISK MANAGEMENT:** Factor neutrality, hard loss limits, borrow constraints.
**HEDGING:** Long-short residual portfolios; market beta hedged.
**EXECUTION:** VWAP/TWAP/implementation shortfall algos.
**AUTOMATION:** Typically highly automated.

**HISTORICAL PERFORMANCE:** see fields below (never fabricated)
**SHARPE:** 1.0 (ESTIMATED)
**SORTINO:** UNKNOWN
**MAX DRAWDOWN:** UNKNOWN
**WIN RATE:** UNKNOWN

**EDGE SCORE:** 70/100
**STRATEGY QUALITY SCORE:** 74/100
**REPRODUCIBILITY SCORE:** 70/100
**IMPLEMENTATION DIFFICULTY:** 6/10
**REGIME DEPENDENCY SCORE:** 60/100
**EVIDENCE LEVEL:** 🟡 STRONGLY SUPPORTED

**PUBLIC SOURCES:** src_gatev_pairs_trading, src_avellaneda_lee_statarb

---

_Not investment advice. Public-information research only._
