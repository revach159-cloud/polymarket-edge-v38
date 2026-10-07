# STRATEGY CARD — Cross-Sectional Equity Momentum

**STRATEGY:** Cross-Sectional Equity Momentum
**SOURCE:** src_jegadeesh_titman_1993, src_aqr_momentum_paper
**FUND / TRADER:** org_aqr_capital_management, org_aqr_momentum_factor_desk, org_man_group

**MARKET:** Global equities
**ASSET CLASS:** Equity
**TIMEFRAME:** months
**STRATEGY TYPE:** Momentum, Cross-sectional momentum, Low frequency
**CORE EDGE:** BEHAVIORAL

**DATA:** Total return price histories, corporate actions, investability filters.
**SIGNAL:** Rank assets by past 3–12 month returns excluding recent month; long winners / short losers.
**ENTRY:** Rebalance on schedule into top/bottom momentum quantiles.
**EXIT:** Exit when rank falls out of selected quantile at next rebalance.
**POSITION SIZING:** Equal-weight or risk-parity within sleeves; volatility scaling common.
**RISK MANAGEMENT:** Sector/country neutralization; volatility targeting; drawdown controls.
**HEDGING:** Often run long-short market-neutral or long-only factor tilts.
**EXECUTION:** Periodic rebalance with transaction-cost optimization.
**AUTOMATION:** Fully systematizable; widely automated in industry.

**HISTORICAL PERFORMANCE:** see fields below (never fabricated)
**SHARPE:** 0.4 (ESTIMATED)
**SORTINO:** UNKNOWN
**MAX DRAWDOWN:** UNKNOWN — Momentum crashes documented e.g. 2009
**WIN RATE:** UNKNOWN

**EDGE SCORE:** 72/100
**STRATEGY QUALITY SCORE:** 80/100
**REPRODUCIBILITY SCORE:** 85/100
**IMPLEMENTATION DIFFICULTY:** 4/10
**REGIME DEPENDENCY SCORE:** 70/100
**EVIDENCE LEVEL:** 🟢 CONFIRMED

**PUBLIC SOURCES:** src_jegadeesh_titman_1993, src_aqr_momentum_paper

---

_Not investment advice. Public-information research only._
