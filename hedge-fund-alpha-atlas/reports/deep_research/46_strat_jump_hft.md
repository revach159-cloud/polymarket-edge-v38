# Deep Research — Jump Trading HFT / Research Characterization

- Strategy ID: `strat_jump_hft`
- Evidence: STRONGLY_SUPPORTED
- Edge score: 82
- Quality: 77
- Reproducibility: 12
- Regime dependency: 55

## Bias & Fragility Checklist

- Crowding: UNKNOWN to ESTIMATED high for well-known factors
- Capacity: UNKNOWN
- Transaction costs: Must be modeled; UNKNOWN impact without specific market/timeframe study
- Slippage: Critical for HFT/MM; material for daily stat arb
- Survivorship bias: High risk in fund databases and retail bot leaderboards
- Look-ahead bias: High risk in fundamental and alt-data pipelines
- Overfitting: High risk in ML and hyperopt bot strategies
- Data mining: High risk when searching large alpha libraries without strict OOS

## Known Failures / Limitations

- Momentum crashes / carry crashes / vol explosions depending on style
- Crowding and fee compression

- Transaction costs
- Slippage
- Capacity
- Regime dependence

## Second-Pass Notes

Deep pass emphasizes bias checklist over flashy returns. Prefer strategies with multi-decade academic+industry corroboration and transparent reconstruction paths.
