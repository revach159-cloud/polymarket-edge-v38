# Crypto Setup Pro × Polymarket Strategy Integration

**Status:** AUDIT + PLAN ONLY — **NO CODE CHANGES IMPLEMENTED**  
**Date:** 2026-08-10  
**CSP target:** https://crypto-setup-pro.vercel.app (title: *Precision Crypto Engine*)  
**Source strategies:** `docs/STRATEGY_INVENTORY.md` (Polymarket Daily Edge / heuristic-v1)  
**CSP source audited:** Live deployed single-file HTML/JS (public).  
**CSP GitHub repo in this Cloud Agent environment:** **NOT AVAILABLE**

---

## BLOCKER (must resolve before implementation)

This agent environment is attached only to:

`github.com/revach159-cloud/polymarket-edge-v38`

Crypto Setup Pro was **not** found as an accessible repository under the owner
(`crypto-setup-pro`, `CryptoSetupPro`, etc. unresolved). The live site is a
**single-page client app** with all strategy logic inline and trade history in
`localStorage` (`precision_journal_v3`).

**Required before coding:**

1. Provide the Crypto Setup Pro GitHub URL and grant access, **or**
2. Confirm the Vercel single-file app is the sole source of truth and tell the
   agent where to push changes (new repo / existing repo / Vercel-only), **or**
3. Add the CSP repo to this Cloud Agent environment.

Until then: audit, compatibility matrix, and implementation plan only.

---

## STEP 1–2 — CRYPTO SETUP PRO AUDIT & STRATEGY INVENTORY

### Architecture (verified from live HTML)

| Layer | Finding |
|---|---|
| Stack | Single HTML file, vanilla JS, RTL Hebrew UI |
| Data | Bybit linear USDT perpetuals (tickers, klines, OI); Alternative.me Fear&Greed; CoinGecko BTC dominance |
| Persistence | Browser `localStorage` only — journal + open position state |
| Backend / DB / API | **None found** (no server strategies, no Supabase, no REST API of its own) |
| Execution | Paper journal only — opens/closes simulated trades on LONG/SHORT labels; does not place exchange orders |

### Existing “strategies” / engines (PROTECTED BASELINE)

CSP does **not** expose named independent strategies like “RSI Strategy”.
It is **one multi-gate confirmation engine** with scored components.

| # | Name (descriptive) | Internal | Role | File (live) |
|---|---|---|---|---|
| CSP-1 | Multi-TF Trend Direction | `trend` + TF votes | PRIMARY direction | inline `trend()`, `analyze()` |
| CSP-2 | 10-Gate Confirmation Filter | `g` object / `passed` | FILTER + confirmation | `analyze()` |
| CSP-3 | Edge Score Ensemble | `score` weighted mix | RANKING / probability-like | `analyze()` |
| CSP-4 | Market Regime (BTC/ETH) | `regime()` | REGIME | `regime()` |
| CSP-5 | Historical Win-Rate Component | `hist()` | PROBABILITY / analytics | `hist()` |
| CSP-6 | Opportunity / Best Available | `opportunity()` | RANKING fallback | `opportunity()` |
| CSP-7 | Trade Manager (stop/TP) | `openTrade` / `closeTrade` | RISK / exit | journal helpers |

#### CSP-1 — Multi-TF Trend Direction

- **Indicators:** EMA20, EMA50 on closes; per-TF vote `+1 / 0 / -1`
- **Timeframes:** 5m, 15m, 1h, 4h (asset); regime also uses BTC 5/15/60/240 + ETH 60/240
- **Direction:** `side = sum(t5+t15+t1+t4) >= 0 ? LONG : SHORT`
- **Agreement:** count of TFs matching chosen direction

#### CSP-2 — 10-Gate Confirmation (`g`)

| Gate | Condition |
|---|---|
| market | Regime aligned (not NEUTRAL; BULL↔LONG / BEAR↔SHORT) |
| agreement | ≥3 of 4 TFs agree with direction |
| structure | Break of 30-bar high/low (excl. last 3) matches side |
| momentum | RSI(14) on 1h: LONG 50–74; SHORT 26–50 |
| adx | ADX-like ≥ 18 on 1h |
| volume | 15m last vol / 20-bar avg ≥ 1.02 |
| funding | \|funding%\| ≤ 0.06 |
| liquidity | 24h turnover ≥ 1.2e7 **and** mid spread ≤ 0.1% |
| rr | R:R to 80-bar extreme vs ATR stop ≥ 1.6 |
| trigger | 5m and 15m trends both match direction |
| oi | *(added if pre≥7)* OI change over ~15m×12 samples > 0 |

**Labeling:**

| Label | Rule |
|---|---|
| LONG / SHORT | `passed === 10` AND `score >= 91` |
| WATCH {side} | `passed >= 8` AND `score >= 79` |
| NEAR {side} | `passed >= 7` |
| NO TRADE | else |
| BEST AVAILABLE {side} | Opportunity mode, no active LONG/SHORT, ≥24h since last open, best score≥76 & passed≥7 (or first row) |

#### CSP-3 — Edge Score

```
technical   = min(100, 42 + passed×5 + agree×2)
derivatives = clamp(0..100, 55 + (oi??0)×5 − |F|×280 + (funding_ok?12:−8))
sentiment   = fng==null ? 50 : (LONG ? fng : 100−fng)
regimeScore = aligned?92 : NEUTRAL?50 : 28
historical  = hist(symbol, side)

score = round(
  technical×0.42 + derivatives×0.24 + regimeScore×0.14
  + sentiment×0.10 + historical×0.10
)
```

Constants: `C.enter=91`, `C.watch=79`, `C.best=76`

#### CSP-4 — Regime

Sum of trend votes on BTC(5,15,60,240)+ETH(60,240):  
`≥3 → BULL`, `≤−3 → BEAR`, else `NEUTRAL`

#### CSP-5 — Historical component

Closed journal rows for same symbol+side:  
if sample &lt; 3 → 55; else `clamp(20..90, 35 + winRate×55)`

#### CSP-7 — Risk / exits (paper)

- Stop = entry ± ATR(14) on 1h  
- TP1 = ±1.5 ATR; TP2 = ±2.5 ATR  
- Close on stop or TP2; R = PnL / |entry−stop|  
- One open per symbol

### Indicators actually present

| Indicator | Present? | Notes |
|---|---|---|
| EMA 20/50 | YES | trend |
| RSI 14 | YES | momentum gate |
| ATR 14 | YES | stop / RR |
| ADX-like 14 | YES | simplified DM/TR ratio (not classic Wilder ADX smoothing) |
| Volume relative | YES | 21-bar window |
| Structure break | YES | 30-bar |
| Funding rate | YES | Bybit ticker |
| Open interest Δ | YES | conditional fetch |
| Spread | YES | bid/ask mid |
| Fear & Greed | YES | macro |
| BTC dominance | YES | display + macro load |
| ETH/BTC | YES | display |
| MACD | NO | |
| SMA | NO (EMA only) | |
| VWAP | NO | |
| Order flow / liquidations | NO | |

### Signal pipeline (current)

```
Bybit tickers (USDT linear, top N by turnover)
  + regime(BTC/ETH) + macro(F&G, BTC.D, ETH/BTC)
↓
Per symbol: klines 5/15/60/240 → trend votes → LONG/SHORT side
↓
Gates g[] (+ optional OI) → passed count
↓
Component scores → weighted Edge score
↓
Label: LONG|SHORT|WATCH|NEAR|NO TRADE (|BEST AVAILABLE)
↓
If LONG/SHORT and no active state → open paper trade + journal snapshot
↓
Monitor stop/TP2 → WIN/LOSS R multiple
↓
UI table + watchlist + journal + audit dialog
```

---

## STEP 3 — BASELINE V1 PERFORMANCE

**Data source available to this agent:** live formulas only.  
Trade outcomes live in **each browser’s localStorage** — not accessible remotely.

| Metric | Value |
|---|---|
| total signals (production) | **NOT AVAILABLE FROM CURRENT DATA** |
| successful / failed | **NOT AVAILABLE FROM CURRENT DATA** |
| win rate | **NOT AVAILABLE FROM CURRENT DATA** |
| precision | **NOT AVAILABLE FROM CURRENT DATA** |
| average return / ROI | **NOT AVAILABLE FROM CURRENT DATA** |
| max drawdown | **NOT AVAILABLE FROM CURRENT DATA** |
| avg confidence / by confidence | **NOT AVAILABLE FROM CURRENT DATA** (score≠calibrated probability) |
| by strategy / asset / TF / regime | **NOT AVAILABLE FROM CURRENT DATA** |

**What *is* measurable after access:**

- Export/import `precision_journal_v3` or add durable server journal
- Compute: closed count, win rate, sum R, avg R, by symbol/side/regime from snapshots

**Baseline status:** `BASELINE V1 = INSUFFICIENT DATA FOR VALIDATION`  
Do **not** claim current accuracy/ROI.

---

## STEP 4 — POLYMARKET STRATEGIES (source)

From `docs/STRATEGY_INVENTORY.md` (verified in Polymarket Edge code):

1. Heuristic-v1 fair-probability ensemble (7 factors)  
2. Edge & side selection (`computeEdge` + favorite lock)  
3. Quality score engine  
4. Emit eligibility filter (`passesFilters`)  
5. Gold candidate filter  
6. Daily quality gate / champion selection  
7. Smart rank score  
8. Wallet consensus playbook  

Plus analytics libs (Wilson/Brier/calibration) — unused for live Polymarket decisions.

---

## STEP 5 — COMPATIBILITY MATRIX

| Polymarket Strategy | Existing CSP | Duplicate? | Complementary? | Conflict? | Adaptation | Recommendation |
|---|---|---|---|---|---|---|
| #1 Heuristic-v1 fair P | CSP-3 Edge score (different math) | Partial overlap (ensemble idea) | YES — as shadow scorer | YES if replaces CSP score | Map crypto features → factors; **do not** use YES price as market P | **SHADOW ANALYTICS / optional RANKING** after validation |
| #2 Edge + favorite lock | Direction from TF sum; Edge=score | Name collision only | Partial (quality of edge) | **HIGH** — favorite lock is prediction-market specific | Translate “edge” to RR/score gap — **do not** lock to 62–97% “probability” | **REJECT favorite lock**; adapt only “fair vs market” if CSP builds a model P |
| #3 Quality score | liquidity/volume/funding gates | Similar intent | YES as soft quality | Low | Replace PM spread/liquidity with Bybit spread/turnover/OI freshness | **FILTER / RANKING (shadow first)** |
| #4 Emit filter | CSP-2 10 gates + enter≥91 | Similar gate philosophy | YES as extra soft veto | Medium if thresholds fight | Align as optional stricter layer, not replace | **FILTER (shadow)** |
| #5 Gold filter | enter=91 + passed=10 | Similar premium tier | YES naming “Gold/Elite” | Low | Premium tier when quality+gates+fresh data | **RANKING / UI badge (shadow→opt-in)** |
| #6 Daily quality gate / tradable band | liquidity/RR/funding gates | Similar | YES false-positive cut | Medium | Adapt “tradable band” → avoid extreme funding/illiquid/poor RR; ignore YES/NO 58–97% | **FILTER (adapted)** |
| #7 Smart rank | score sort + opportunity | Similar ranking | YES urgency/conviction analogs | Low | Urgency→volatility/ATR%; conviction→agree/passed | **RANKING (shadow)** |
| #8 Wallet consensus | none | No | Maybe (smart money) | Needs new data | Requires exchange/whale data source CSP does not have | **NOT DIRECTLY ADAPTABLE** until data source exists |
| Time decay / horizon | none (crypto continuous) | No | Weak | N/A | PM resolution horizon ≠ crypto | **REJECT as-is**; optional session/time-of-day later only with data |
| Category prior | none | No | Maybe | N/A | Needs labeled asset classes + history | **SHADOW / ANALYTICS only** when journal exists |
| Freeze near resolution | none | No | No | N/A | PM-specific | **REJECT** |
| Wilson / Brier / calibration | hist() crude | Partial | YES | Low | Use on journal outcomes | **ANALYTICS + calibration (high value)** |
| Online learning | hist() already mild learning | Partial | Strengthen with sample size | Medium if overfits | Keep conservative; Wilson LB | **Enhance CSP-5 carefully** |

### Universally transferable (recommended import candidates)

1. Data-quality / freshness gate  
2. Quality composite (liquidity, spread, volume, factor stability)  
3. Multi-signal confirmation vs conflict accounting (without inventing independence)  
4. Premium “Gold” tier as stricter filter (not new primary model)  
5. Ranking overlay (quality + conviction + urgency analogs)  
6. Calibration / Wilson reporting on real journal outcomes  
7. Shadow-mode dual engine comparison  
8. Versioned engine (V1 baseline protected)

### Polymarket-specific — DO NOT copy

- YES/NO market probability & favorite lock 62–97%  
- Resolution / close-time buckets / freeze-before-end  
- Prediction-market liquidity/volume thresholds as literal USD numbers  
- Wallet consensus from Polymarket Data API  
- `P_fair = P_market + small adjustment` using PM prices  

---

## STEP 6 — IMPLEMENTATION PLAN (awaiting approval)

### Guiding principles

- **PROTECTED BASELINE = current CSP engine (CSP-1…CSP-7)** unchanged as Engine V1  
- New logic = **ADDITIONAL INTELLIGENCE**, default **SHADOW MODE**  
- No fake win rates / accuracy claims  
- Quality &gt; quantity; no arbitrary 40/30/30 weights without data  
- Engine V1 must remain runnable for regression  

### Proposed Engine V2 architecture (additive)

```
ENGINE V1 (existing analyze / gates / score / labels)  ← PRODUCTION DEFAULT
        │
        ├── shadow: QualityAdapter (from PM #3+#4+#6 ideas)
        ├── shadow: SmartRankAdapter (from PM #7)
        ├── shadow: ConfirmationConflict report (agreement vs anti gates)
        ├── shadow: Calibration / Wilson on journal (from PM analytics)
        └── optional later: HeuristicFactorShadow (crypto-mapped #1) — only if features exist

FINAL PRODUCTION SIGNAL = V1 until shadow proves non-degradation
```

### Adapter layer (conceptual)

| Adapter | Inputs (crypto) | PM concept mapped | Output role |
|---|---|---|---|
| `dataQualityGate` | kline length, NaN, spread, turnover, timestamp age | freshness + emit filters | FILTER → `INSUFFICIENT_DATA` |
| `qualityScore01` | spread%, turnover, vol ratio, gate stability | `computeQuality` | RANKING / FILTER |
| `smartRankOverlay` | V1 score, passed, agree, ATR%, gold-like flag | `computeSmartScore` | RANKING |
| `premiumTier` | quality + passed + score + data OK | Gold | UI badge / optional stricter enter |
| `calibrationReport` | journal wins by score bucket | Wilson/Brier | ANALYTICS only until validated |
| `heuristicShadow` | **NOT DIRECTLY ADAPTABLE** without defined crypto “market probability” | fair P | Keep shadow research only |

### Role assignments (imported ideas)

| Idea | Role | Initial mode |
|---|---|---|
| Data quality gate | FILTER | Shadow → can activate if zero degradation |
| Quality score | FILTER + RANKING | Shadow |
| Premium tier (Gold) | FILTER / RANKING | Shadow |
| Smart rank overlay | RANKING | Shadow |
| Confirmation/conflict explain | ANALYTICS (+ soft confidence dampen only with data) | Shadow |
| Calibration / Wilson | ANALYTICS | Always on once journal durable |
| Heuristic fair-P | ANALYTICS | Shadow research; **not PRIMARY** |
| Wallet consensus | — | Deferred / NOT DIRECTLY ADAPTABLE |
| Favorite lock / PM resolution | — | **REJECTED** |

### Phased delivery (after approval + repo access)

**Phase A — Foundation (no signal change)**  
1. Move CSP from single HTML into versioned source (if confirmed).  
2. Extract Engine V1 into named module; pin `ENGINE_VERSION=v1`.  
3. Durable journal export/import (JSON) for baseline measurement.  
4. Unit tests reproducing current gate/score labels bit-for-bit.

**Phase B — Baseline measurement**  
5. Compute BASELINE V1 from real journal (user export or server).  
6. Document metrics; mark unavailable ones honestly.

**Phase C — Shadow adapters**  
7. Implement adapters behind `shadow: true`.  
8. Store shadow rows: timestamp, symbol, TF, adapter, signal, score, V1 label, regime.  
9. UI: optional “Shadow” columns / audit fields — **V1 labels unchanged**.

**Phase D — Validation**  
10. Compare V1 vs V1+shadow filters offline (false positives, R, win rate).  
11. Activate only adapters that do not degrade V1 (non-degradation rule).  
12. No performance-based weights until sample size sufficient (define min N, e.g. ≥30 closed per bucket — exact N TBD from data).

**Phase E — Optional UI explainability**  
13. Extend audit dialog: supporting gates, conflicts (`anti`), quality, shadow notes — only real fields.

### Explicit non-goals (this plan)

- Rewriting trend/RSI/ADX/volume core  
- Replacing Edge score with heuristic-v1  
- Copying Polymarket YES/NO math  
- Claiming accuracy improvements without measured A/B  
- Averaging conflicting LONG/SHORT without conflict handling  

### Testing plan (post-implementation)

- Unit: each gate, score formula, labels match V1 golden vectors  
- Regression: V1 production path identical when shadow off  
- Shadow: adapters fail soft (`INSUFFICIENT_DATA`) without crashing scan  
- No DB wipe (when/if DB added — migrations only)  

### Expected deliverables when coding is approved

1. Engine V1 preserved  
2. Shadow adapters for transferable ideas  
3. Rejected list documented in code comments / docs  
4. Baseline + shadow comparison report (real data only)  
5. Strategy matrix: Existing/New · Role · Active/Shadow · Performance · Notes  

---

## APPROVAL CHECKLIST

Reply with approval / adjustments on:

- [ ] Confirm CSP source of truth (repo URL or “single HTML is truth”)  
- [ ] Approve **shadow-first** additive plan (no V1 replacement)  
- [ ] Approve **rejection** of favorite-lock / PM resolution / Polymarket wallet API  
- [ ] Approve durable journal / baseline measurement approach  
- [ ] Any UI changes allowed in audit dialog only vs table columns  

**No implementation will start until you approve and unblock repository access.**

---

## Appendix — Source map (CSP live)

| Concern | Location |
|---|---|
| Thresholds enter/watch/best | `C={enter:91,watch:79,best:76}` |
| Indicators | `ema`, `rsi`, `trend`, `atr`, `adx`, `vol`, `structure`, `spread`, `rr` |
| Main signal | `analyze(t)` |
| Regime | `regime()` |
| History score | `hist()` |
| Journal | `precision_journal_v3` localStorage |
| Position state | `precision_state_v2` localStorage |
| Scan loop | `scan()` |
| UI | same HTML file |

Polymarket source map: see `docs/STRATEGY_INVENTORY.md` §15.
