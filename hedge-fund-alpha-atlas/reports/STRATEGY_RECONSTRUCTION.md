# Strategy Reconstruction Maps

## Medallion-Style Short-Horizon Statistical Prediction (Public Characterization)

- **DATA** [🟡 STRONGLY SUPPORTED]: High-quality historical market data; alternative data role UNKNOWN.
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public sources describe ensembles of short-horizon predictive signals from price/volume and other features; exact features UNKNOWN.
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public sources describe ensembles of short-horizon predictive signals from price/volume and other features; exact features UNKNOWN.
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🔴 SPECULATIVE]: Highly constrained optimization with risk limits; Kelly-like speculation is SPECULATIVE.
- **EXECUTION** [🟠 INFERRED]: Low-latency execution important; proprietary stack UNKNOWN.
- **RISK_MANAGEMENT** [🟡 STRONGLY SUPPORTED]: Strict risk overlays and diversification across many weak signals (public interviews/books).
- **EXIT** [🟠 INFERRED]: Short holding periods; continuous re-forecasting; exact exit rules UNKNOWN.
- **PORTFOLIO_MANAGEMENT** [🟡 STRONGLY SUPPORTED]: Market-neutral / hedged characterization common in public literature.

## Time-Series Trend Following (CTA)

- **DATA** [🟢 CONFIRMED]: Futures prices, rolls, volatility estimates.
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟢 CONFIRMED]: Price above/below moving averages or positive time-series momentum; multi-horizon blends common.
- **SIGNAL_GENERATION** [🟢 CONFIRMED]: Price above/below moving averages or positive time-series momentum; multi-horizon blends common.
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟢 CONFIRMED]: Volatility targeting / risk parity across markets is standard public practice.
- **EXECUTION** [🟡 STRONGLY SUPPORTED]: Mostly daily/weekly; some intraday overlays.
- **RISK_MANAGEMENT** [🟢 CONFIRMED]: Vol scaling, correlation-aware allocation, max leverage caps.
- **EXIT** [🟡 STRONGLY SUPPORTED]: Exit or reverse on signal flip; trailing stops sometimes used.
- **PORTFOLIO_MANAGEMENT** [🟡 STRONGLY SUPPORTED]: Diversification across uncorrelated futures; not classic beta hedge.

## Cross-Sectional Equity Momentum

- **DATA** [🟢 CONFIRMED]: Total return price histories, corporate actions, investability filters.
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟢 CONFIRMED]: Rank assets by past 3–12 month returns excluding recent month; long winners / short losers.
- **SIGNAL_GENERATION** [🟢 CONFIRMED]: Rank assets by past 3–12 month returns excluding recent month; long winners / short losers.
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟡 STRONGLY SUPPORTED]: Equal-weight or risk-parity within sleeves; volatility scaling common.
- **EXECUTION** [🟡 STRONGLY SUPPORTED]: Periodic rebalance with transaction-cost optimization.
- **RISK_MANAGEMENT** [🟡 STRONGLY SUPPORTED]: Sector/country neutralization; volatility targeting; drawdown controls.
- **EXIT** [🟢 CONFIRMED]: Exit when rank falls out of selected quantile at next rebalance.
- **PORTFOLIO_MANAGEMENT** [🟢 CONFIRMED]: Often run long-short market-neutral or long-only factor tilts.

## Pairs / Residual Mean-Reversion Stat Arb

- **DATA** [🟡 STRONGLY SUPPORTED]: Point-in-time fundamentals/prices, borrow, corporate actions.
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Cointegration / residual z-score vs peer basket or factor model; trade dislocations.
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Cointegration / residual z-score vs peer basket or factor model; trade dislocations.
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟡 STRONGLY SUPPORTED]: Dollar or beta neutrality; volatility-scaled legs.
- **EXECUTION** [🟡 STRONGLY SUPPORTED]: VWAP/TWAP/implementation shortfall algos.
- **RISK_MANAGEMENT** [🟡 STRONGLY SUPPORTED]: Factor neutrality, hard loss limits, borrow constraints.
- **EXIT** [🟢 CONFIRMED]: Exit at mean reversion / time stop / stop-loss on residual.
- **PORTFOLIO_MANAGEMENT** [🟢 CONFIRMED]: Long-short residual portfolios; market beta hedged.

## Citadel Multi-Strategy Aggregation

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Citadel Multi-Strategy Aggregation
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Citadel Multi-Strategy Aggregation
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## XTX ML Market Making Characterization

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: XTX ML Market Making Characterization
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: XTX ML Market Making Characterization
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Jump Trading HFT / Research Characterization

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Jump Trading HFT / Research Characterization
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Jump Trading HFT / Research Characterization
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Electronic Equity Market Making

- **DATA** [🟡 STRONGLY SUPPORTED]: Full depth/L3, proprietary normalized market data.
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Microprice, queue position, inventory, short-term order-flow imbalance; exact models proprietary.
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Microprice, queue position, inventory, short-term order-flow imbalance; exact models proprietary.
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟡 STRONGLY SUPPORTED]: Inventory caps; risk units by symbol volatility and ADV.
- **EXECUTION** [🟢 CONFIRMED]: Co-located matching-engine access; smart order routing.
- **RISK_MANAGEMENT** [🟢 CONFIRMED]: Kill switches, fat-finger limits, venue risk, toxicity filters.
- **EXIT** [🟡 STRONGLY SUPPORTED]: Inventory mean-reversion; skew quotes; hard flatten limits.
- **PORTFOLIO_MANAGEMENT** [🟡 STRONGLY SUPPORTED]: ETF/index/correlated hedges for residual inventory.

## D.E. Shaw Computational/Stat Arb Characterization

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: D.E. Shaw Computational/Stat Arb Characterization
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: D.E. Shaw Computational/Stat Arb Characterization
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## HRT HFT Liquidity Provision

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: HRT HFT Liquidity Provision
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: HRT HFT Liquidity Provision
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Optiver Options Pricing MM

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Optiver Options Pricing MM
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Optiver Options Pricing MM
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Volatility Risk Premium / Short Volatility (Public Forms)

- **DATA** [🟡 STRONGLY SUPPORTED]: Option surfaces, realized vol estimators.
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Implied vol rich vs expected realized; harvest premium via option structures.
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Implied vol rich vs expected realized; harvest premium via option structures.
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟢 CONFIRMED]: Strict loss budgets; tail risk dominates.
- **EXECUTION** [🟡 STRONGLY SUPPORTED]: Listed options; careful roll of short vol ETPs if used (retail forms fragile).
- **RISK_MANAGEMENT** [🟢 CONFIRMED]: Crash convexity; hedging with wings/variance; kill switches.
- **EXIT** [🟡 STRONGLY SUPPORTED]: Expiry, buyback on rich-to-cheap flip, or risk limits.
- **PORTFOLIO_MANAGEMENT** [🟢 CONFIRMED]: Delta hedge; sometimes vega/correlation hedges.

## ETF / Closed-End Relative Value MM

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: ETF / Closed-End Relative Value MM
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: ETF / Closed-End Relative Value MM
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## IMC Market Making

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: IMC Market Making
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: IMC Market Making
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## SIG-Style Options Market Making

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: SIG-Style Options Market Making
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: SIG-Style Options Market Making
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Two Sigma Style ML Equity (Public Characterization)

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Two Sigma Style ML Equity (Public Characterization)
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Two Sigma Style ML Equity (Public Characterization)
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Tower Research HFT

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Tower Research HFT
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Tower Research HFT
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Moskowitz-Style Multi-Asset TSMOM

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Moskowitz-Style Multi-Asset TSMOM
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Moskowitz-Style Multi-Asset TSMOM
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Man AHL Dimension / Evolution Style

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Man AHL Dimension / Evolution Style
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Man AHL Dimension / Evolution Style
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## FX Carry Trade

- **DATA** [🟢 CONFIRMED]: Interest rates, spot FX, rolls.
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟢 CONFIRMED]: Long high-yielding currencies / short low-yielding; interest rate differential.
- **SIGNAL_GENERATION** [🟢 CONFIRMED]: Long high-yielding currencies / short low-yielding; interest rate differential.
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟡 STRONGLY SUPPORTED]: Vol targeting; crash-risk aware sizing recommended in literature.
- **EXECUTION** [🟢 CONFIRMED]: Spot/forwards/futures; low frequency.
- **RISK_MANAGEMENT** [🟢 CONFIRMED]: Carry crashes in risk-off; use trend/vol filters in research variants.
- **EXIT** [🟡 STRONGLY SUPPORTED]: Rebalance on carry ranks; crash risk overlays sometimes added.
- **PORTFOLIO_MANAGEMENT** [🟠 INFERRED]: Basket construction provides partial diversification.

## Order-Flow / Toxicity-Aware MM

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Order-Flow / Toxicity-Aware MM
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Order-Flow / Toxicity-Aware MM
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Pod-Shop Idiosyncratic Alpha Aggregation

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Pod-Shop Idiosyncratic Alpha Aggregation
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Pod-Shop Idiosyncratic Alpha Aggregation
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Voleon ML Trading Characterization

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Voleon ML Trading Characterization
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Voleon ML Trading Characterization
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Flow Traders ETF MM

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Flow Traders ETF MM
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Flow Traders ETF MM
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent

## Multi-Style Risk Premia Stack

- **DATA** [🟡 STRONGLY SUPPORTED]: Market data appropriate to asset class; alt-data if noted
- **DATA_CLEANING** [🟠 INFERRED]: Point-in-time alignment, corporate actions, outlier filters (general quant hygiene)
- **FEATURE_ENGINEERING** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Multi-Style Risk Premia Stack
- **SIGNAL_GENERATION** [🟡 STRONGLY SUPPORTED]: Public literature characterizes primary signal family for: Multi-Style Risk Premia Stack
- **PROBABILITY_OR_EXPECTED_RETURN** [🟠 INFERRED]: Map features to expected return / edge estimate after costs
- **TRADE_FILTER** [🟠 INFERRED]: Liquidity, borrow, news halts, risk budget filters
- **POSITION_SIZING** [🟠 INFERRED]: Often volatility-scaled in systematic implementations
- **EXECUTION** [🟠 INFERRED]: Varies from daily rebalance to low-latency
- **RISK_MANAGEMENT** [🟠 INFERRED]: Drawdown limits / diversification; specifics vary
- **EXIT** [🟠 INFERRED]: Regime-/signal-dependent exits per public descriptions
- **PORTFOLIO_MANAGEMENT** [🔴 UNKNOWN]: Strategy-dependent
