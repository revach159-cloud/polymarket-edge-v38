# Polymarket Daily Edge — Master Strategy Inventory

**Forensic extraction only.** No strategies were invented. Every claim below is
traceable to source code, schema, or configuration in this repository.

**Extraction date:** 2026-08-10  
**Primary model in code:** `heuristic-v1` @ `1.0.0`  
**Live path used by UI:** `src/services/markets.ts` → `enrichMarkets` → `scoreMarket` → `selectDailyPredictions`  
**Second-pass search:** completed against all strategy-related files listed in §15.

---

## 1. EXECUTIVE SUMMARY

| Count category | Count | Notes |
|---|---:|---|
| **Verified real strategy / selection algorithms** | **8** | Distinct implemented algorithms (see §2) |
| Of which **active in the live UI feed** | **7** | All except orphaned `listScoredMarkets` path pieces that are unused; freeze + emit filter still run inside scoring |
| **UI-only (label with no implementation)** | **0** | No fake named strategy chips found |
| **Backend-only / not exposed as named UI strategy** | **3** | Emit filter (`passesFilters`/`should_emit`), freeze rules, orphaned `server/services/markets.ts` scoring helper |
| **Partial** | **3** | Wallet consensus (feeds model but DB consensus table unused), category_prior (weight exists, input never supplied), volume momentum ratio path (previousVolume never supplied) |
| **Deprecated / unused analytics “strategies”** | **4** | Brier / log-loss / calibration (lib only), user_preferences min_edge/min_confidence (schema only), seed DB config (not loaded), `prediction_factors` writes (table exists, never written) |

**Bottom line:** There is **one** prediction model (`heuristic-v1`), composed of
**seven weighted factors**. Around it sit **selection, ranking, gold, wallet,
freeze, and quality-gate** layers. There is **no Kelly sizing, no arbitrage
engine, no mean-reversion strategy, no backtester that changes model weights,
and no online learning loop that feeds historical accuracy back into future
probabilities**.

---

## 2. COMPLETE STRATEGY LIST

1. **Heuristic-v1 Fair-Probability Ensemble** — main prediction model  
2. **Edge & Side Selection (`computeEdge`)** — including favorite-lock rule  
3. **Quality Score Engine (`computeQuality`)** — data/liquidity confidence composite  
4. **Emit Eligibility Filter (`passesFilters` / `should_emit`)** — threshold gate inside scoring  
5. **Gold Candidate Filter (`isGoldCandidate`)** — premium pick overlay  
6. **Daily Quality Gate & Champion Selection (`isQualityPrediction` / `selectDailyPredictions`)** — UI list builder  
7. **Smart Rank Score (`computeSmartScore`)** — default sort / top picks  
8. **Wallet Consensus Playbook (`getWalletPlaybook`)** — smart-money signal input  

**Ensemble factor components (not independent strategies):**  
`price_dislocation`, `spread_quality`, `volume_momentum`, `liquidity_depth`,
`time_decay`, `wallet_consensus`, `category_prior`.

---

## 3. MASTER STRATEGY TABLE

| # | Strategy | Status | Location | Type | Main Signal | Confidence | Edge | Risk | Historical Learning |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Heuristic-v1 Fair Probability | IMPLEMENTED + ACTIVE + UI | `src/lib/predictions/{config,factors,scoring,enrich}.ts` | Ensemble / Value | Weighted factor score → fair P | Yes (scoring formula) | Via #2 | None (analysis only) | NO |
| 2 | Edge & Side Selection | IMPLEMENTED + ACTIVE + UI | `src/lib/predictions/edge.ts` | Value / Mispricing + Favorite lock | fair−market / market−0.5 | Uses scoring confidence | Yes | None | NO |
| 3 | Quality Score Engine | IMPLEMENTED + ACTIVE + UI | `src/lib/predictions/quality.ts` | Liquidity / Risk-adjusted quality | confidence+spread+liq+vol+stability | Input to quality | Indirect | Soft (quality bars) | NO |
| 4 | Emit Eligibility Filter | IMPLEMENTED + BACKEND ONLY | `src/lib/predictions/filter.ts` | Threshold gate | min edge/conf/quality/spread/liq/vol | Threshold | Threshold | Gate only | NO |
| 5 | Gold Candidate Filter | IMPLEMENTED + ACTIVE + UI | `src/lib/predictions/gold.ts` + `/gold` | Multi-signal premium filter | Stricter thresholds + supporting factors | Threshold | Threshold | Gate only | NO |
| 6 | Daily Quality Gate | IMPLEMENTED + ACTIVE + UI | `src/lib/markets/quality-gate.ts` | Market selection | Tradable win-prob band + near-close soft bars | Uses qualityScore | Uses \|edge\| in sort | Soft filters | NO |
| 7 | Smart Rank | IMPLEMENTED + ACTIVE + UI | `src/lib/markets/smart-rank.ts` | Ranking / Time-to-resolution | quality+edge+conviction+urgency+wallet | No separate | Uses \|edge\| | None | NO |
| 8 | Wallet Consensus Playbook | IMPLEMENTED + ACTIVE + UI (partial DB) | `src/lib/wallets/intelligence.ts` | Smart money / Wallet | yesSize/(yes+no) from top wallets | Feeds factor | Feeds lean in fair P | None | NO (snapshot only) |

---

## 4. DETAILED STRATEGY DOCUMENTATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Heuristic-v1 Fair-Probability Ensemble  

**INTERNAL NAME:** `heuristic-v1` / `HEURISTIC_V1` / `MODEL_NAME`

**STATUS:** IMPLEMENTED + ACTIVE + UI

**CATEGORY:** K. ENSEMBLE / MULTI-SIGNAL · also A. VALUE / EDGE · J. AI/MODEL only in the sense of a named model (explicitly **not** ML)

**PURPOSE:** Estimate a “fair” probability for YES relative to the market price using seven weighted heuristic factors, then drive side/edge/quality/gold.

**CODE LOCATION:**
- Config: `src/lib/predictions/config.ts`
- Factors: `src/lib/predictions/factors.ts` → `computeFactors`
- Fair P + confidence: `src/lib/predictions/scoring.ts` → `estimateFairProbability`
- Orchestration: `scoreMarket`, applied by `enrichMarketWithHeuristic` in `src/lib/predictions/enrich.ts`
- Live service: `src/services/markets.ts`

**ENTRY CONDITIONS:** Market has a YES price (otherwise enrich returns null scores). Scoring always runs when `marketProb != null`.

**REJECTION CONDITIONS:** Not rejected inside the model itself; downstream gates (#4, #5, #6) reject. Enrich sets nulls when price missing.

**INPUT DATA:**
- `marketProbability` (YES price)
- `spread`, `volume`, `liquidity`
- `hoursToEnd` / `endDate`
- `walletConsensusScore` (optional)
- `category` (display only unless `categoryPrior` supplied — **never supplied in live enrich path**)
- `previousVolume` (**never supplied in live enrich path**)
- freshness / resolution clarity flags

**FORMULAS:**

Factor values (each clamped to [0,1]):

1. **price_dislocation**  
   `V_pd = clamp(|P_market − 0.5| × 2)`

2. **spread_quality**  
   If spread null → `0.4`  
   If spread ≤ 0 → `1`  
   Else `V_sq = clamp(1 − spread / max_spread)` with `max_spread = 0.08`

3. **volume_momentum**  
   If no `previousVolume`: `V_vm = clamp(log10(max(volume,1)) / 6)`  
   Else: `V_vm = clamp(0.5 + tanh(log(volume/previousVolume)) × 0.5)`

4. **liquidity_depth**  
   `V_ld = clamp( log10(max(liquidity,1)+1) / log10(min_liquidity×20 + 1) )`  
   Note: `computeFactors` default `minLiquidity` option is **500** if omitted; `scoreMarket` passes `config.thresholds.min_liquidity` (= **1000**).

5. **time_decay**  
   | hoursToEnd | value |
   |---|---|
   | null or &lt; 0 | 0.5 |
   | ≤ 2 | 1.0 |
   | ≤ 5 | 0.95 |
   | &lt; 24 | 0.85 |
   | &lt; 168 | 0.7 |
   | &lt; 720 | 0.5 |
   | else | 0.3 |

6. **wallet_consensus**  
   null → `0.5`, else clamp(score)

7. **category_prior**  
   null → `0.5`, else clamp(prior) — **live path always null → 0.5**

Contribution: `contribution_i = V_i × w_i`

Weights (`HEURISTIC_V1.weights`):

| Factor | Weight |
|---|---:|
| price_dislocation | 0.18 |
| spread_quality | 0.16 |
| volume_momentum | 0.12 |
| liquidity_depth | 0.16 |
| time_decay | 0.14 |
| wallet_consensus | 0.14 |
| category_prior | 0.10 |

Fair probability:

```
weightSum = Σ |w_i|
score     = (Σ contribution_i) / weightSum
lean      = (wallet_consensus − 0.5) × 2
adjustment = (score − 0.5) × 0.2 + lean × price_dislocation × 0.08
P_fair    = clamp(P_market + adjustment)
```

**THRESHOLDS:** See §6 (model thresholds). Emit/gold thresholds applied after scoring.

**PROBABILITY LOGIC:** `P_fair` above; market P = YES price clamped.

**EDGE LOGIC:** Delegated to Strategy #2.

**CONFIDENCE LOGIC (scoring path):**

```
confidence = clamp(
  0.35
  + spread_quality × 0.25
  + liquidity_depth × 0.20
  + price_dislocation × 0.20
)
```

**RISK LOGIC:** None for capital. Primary-risk text from weak factors / reject reasons / wallet disagreement in enrich.

**RANKING LOGIC:** Indirect via qualityScore / smartScore.

**HISTORICAL DATA:** Category prior *could* use history but is never computed/passed. **NO VERIFIED ONLINE LEARNING LOOP FOUND.**

**OUTPUT:** `fair_probability`, `confidence`, factors[], feeds edge/quality/gold.

**UI LOCATION:** Market cards (“מודל”), detail page “הסתברות מודל”, home disclaimer naming heuristic-v1.

**API LOCATION:** No public REST prediction API; computed in server components / cron `run-model`.

**DEPENDENCIES:** Polymarket Gamma (prices/volume/liquidity), optional wallet playbook, CLOB spread when present (often null in Gamma-only enrich).

**KNOWN LIMITATIONS:**
- Not ML; adjustments tiny (±~0.2 scale).
- `category_prior` and ratio-based `volume_momentum` inert in live path.
- `parseHeuristicConfig` exists but live path hard-codes `HEURISTIC_V1` (DB/seed config not applied).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Edge & Side Selection  

**INTERNAL NAME:** `computeEdge`

**STATUS:** IMPLEMENTED + ACTIVE + UI

**CATEGORY:** A. VALUE / EDGE · B. PROBABILITY MISPRICING · (favorite lock is market-following, not pure edge)

**PURPOSE:** Choose YES vs NO and quantify edge shown to users.

**CODE LOCATION:** `src/lib/predictions/edge.ts`

**ENTRY CONDITIONS:** Always called from `scoreMarket` with fair & market P.

**REJECTION CONDITIONS:** None inside function. Extreme ≥98% favorites are *not* favorite-locked (left to fair−market; usually filtered later).

**INPUT DATA:** `fairProbability`, `marketProbability`

**FORMULAS:**

```
yesEdge = P_fair − P_market
noEdge  = P_market − P_fair
FAVORITE_LOCK = 0.62
MAX_FAVORITE_LOCK = 0.97
```

**Case A — YES favorite lock:** `0.62 ≤ P_market < 0.97`  
- side = yes  
- edge = max(yesEdge, P_market − 0.5)  
- win_probability = P_market  

**Case B — NO favorite lock:** `0.03 < P_market ≤ 0.38` (i.e. `P_market ≤ 1−0.62` and `P_market > 1−0.97`)  
- side = no  
- edge = max(noEdge, 0.5 − P_market)  
- win_probability = 1 − P_market  

**Case C — pure fair-vs-market:**  
- if yesEdge ≥ noEdge → side yes, edge = yesEdge, win_prob = max(P_fair, P_market)  
- else → side no, edge = noEdge, win_prob = max(1−P_fair, 1−P_market)

**THRESHOLDS:** Favorite lock 62%–97%; extremes ≥98% unlock.

**EDGE LOGIC:** As above. UI displays `Math.abs(edgeScore)` as percent.

**CONFIDENCE LOGIC:** Not computed here.

**RISK LOGIC:** None.

**RANKING LOGIC:** `|edge|` used in daily gate sort and smart rank.

**HISTORICAL DATA:** None.

**OUTPUT:** `{ side, edge, absolute_edge, fair_probability, market_probability, win_probability }`

**UI LOCATION:** Edge pills on cards; “Edge” on detail page; sort by edge.

**API / DB:** Persisted as `predictions.edge`; local history `edgeScore`.

**DEPENDENCIES:** Strategy #1 fair P.

**KNOWN LIMITATIONS:** Favorite lock can select the market favorite even when fair−market edge is small/negative relative to alternative; edge then becomes distance-from-50% style. Persist path uses `Math.abs(edgeScore)` separately (see Critical Findings).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Quality Score Engine  

**INTERNAL NAME:** `computeQuality` / `quality_score` / `qualityScore`

**STATUS:** IMPLEMENTED + ACTIVE + UI

**CATEGORY:** F. VOLUME / LIQUIDITY · L. RISK-ADJUSTED (soft)

**PURPOSE:** Produce 0–1 (displayed /100) quality that is **explicitly not** win rate.

**CODE LOCATION:** `src/lib/predictions/quality.ts`

**FORMULAS:**

```
spreadScore = spread==null ? 0.5 : clamp(1 − spread/max_spread)
liquidityScore = clamp(liquidity / (min_liquidity × 5))
volumeScore = clamp(volume / (min_volume × 5))
factorStability = clamp(1 − stddev(factor_values) × 1.5)

quality = clamp(
  confidence × 0.35
  + spreadScore × 0.20
  + liquidityScore × 0.20
  + volumeScore × 0.15
  + factorStability × 0.10
)

quality_score_100 = round(quality × 1000) / 10
```

**THRESHOLDS:** Uses `max_spread=0.08`, `min_liquidity=1000`, `min_volume=500` from config for normalization (not hard reject here).

**OUTPUT:** `quality_score`, `quality_score_100` → UI “ציון”.

**KNOWN LIMITATIONS:** When spread is null (common on Gamma-only path), spreadScore defaults to 0.5.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Emit Eligibility Filter  

**INTERNAL NAME:** `passesFilters` / `should_emit`

**STATUS:** IMPLEMENTED + BACKEND ONLY (affects `is_gold` conjunction; **does not** drive the main Markets list — that uses Strategy #6)

**CATEGORY:** L. RISK-ADJUSTED STRATEGIES (gate)

**CODE LOCATION:** `src/lib/predictions/filter.ts` · used in `scoring.ts`

**ENTRY / REJECTION:**

Reject reasons if any fail:
- `edge < min_edge` (0.03)
- `confidence < min_confidence` (0.4)
- `quality < min_quality` (0.55)
- `spread > max_spread` (0.08) when spread non-null
- `liquidity < min_liquidity` (1000)
- `volume < min_volume` (500)

`should_emit = filter.ok && !frozen`

**UI LOCATION:** Not labeled. Influences Gold (`is_gold = gold && filter.ok`). Markets cards use quality-gate instead.

**KNOWN LIMITATIONS:** Dual gate system — #4 vs #6 thresholds differ substantially.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Gold Candidate Filter  

**INTERNAL NAME:** `isGoldCandidate` / `isGoldEligible` / `goldPick` / `is_gold`

**STATUS:** IMPLEMENTED + ACTIVE + UI (page `/gold`, gated by role/plan)

**CATEGORY:** K. ENSEMBLE / MULTI-SIGNAL · A. VALUE

**CODE LOCATION:** `src/lib/predictions/gold.ts`

**REJECTION CONDITIONS (any):**
- `hasConflict` or `resolutionUnclear`
- freshness `stale` or `unavailable`
- `hoursToEnd == null` OR `hoursToEnd > gold_max_hours` (24)
- `edge < gold_edge` (0.05)
- `confidence < gold_confidence` (0.55)
- `quality < gold_quality` (0.7)
- supporting factors (`factor_value ≥ 0.65`) count &lt; 4
- distinct `source_type` among supporting &lt; 3

Additionally must pass Strategy #4 for `is_gold` true in `scoreMarket`.

**Enrich resolutionUnclear:** description missing or length &lt; 40, or critical gaps (no question/endDate/price/clobTokenIds).

**UI LOCATION:** `/gold`, Gold badges on cards, pricing page copy.

**OUTPUT:** boolean `goldPick` / `is_gold`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Daily Quality Gate & Champion Selection  

**INTERNAL NAME:** `isQualityPrediction` / `selectDailyPredictions` / `DAILY_PREDICTION_TARGET`

**STATUS:** IMPLEMENTED + ACTIVE + UI

**CATEGORY:** A/L hybrid — tradable-conviction market selection · I. TIME-TO-RESOLUTION bias

**CODE LOCATION:** `src/lib/markets/quality-gate.ts` · applied in `src/services/markets.ts` when `qualityOnly !== false` for active feeds

**ENTRY CONDITIONS (all required):**
- `active && !closed`
- `selectedOutcome` present
- `endDate` present; hoursToEnd &gt; 0
- Not sports-moneyline with `selectedOutcome === "NO"`
- Not one-sided lock: `max(P, 1−P) ≥ 0.97` rejected
- `MIN_TRADEABLE_WIN ≤ winProb < MAX_TRADEABLE_WIN` where winProb is market-implied for selected side; constants **0.58** and **0.97**
- Coin-flip rules: if `winProb < 0.62` reject unless ultra-near (≤2h) **and** liquidity ≥ 400
- Quality / liquidity / volume bars:
  - nearClose (≤5h): quality ≥ 42, liquidity ≥ 150, volume ≥ 0
  - else: quality ≥ 50, liquidity ≥ 400, volume ≥ 200

**RANKING (selectDailyPredictions):**
1. Near-close tier: ≤2h, then ≤5h, then rest
2. Higher winProb (Δ &gt; 0.02)
3. Higher |edgeScore| (Δ &gt; 0.005)
4. Higher smartScore
5. Higher qualityScore  
Target soft cap **250** (can keep more near-close).

**UI LOCATION:** Markets page subtitle “250+ פרדיקשנים איכותיים”; default active list; cron persist champions; history sync script.

**HISTORICAL DATA:** Recording only — does not adapt thresholds from past win rate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Smart Rank Score  

**INTERNAL NAME:** `computeSmartScore` / sort `"smart"`

**STATUS:** IMPLEMENTED + ACTIVE + UI

**CATEGORY:** I. TIME-TO-RESOLUTION · K. multi-signal ranking · G. wallet lean

**CODE LOCATION:** `src/lib/markets/smart-rank.ts`

**FORMULA:**

```
quality      = qualityScore/100
edge         = min(|edgeScore| × 8, 1)
consensusLean= |(walletConsensusScore ?? 0.5) − 0.5| × 2
conviction   = max(0, (winProb − 0.5) × 2)
urgency      = 1 (≤2h) | 0.92 (≤5h) | 0.7 (≤24h) | 0.45 (≤72h) | 0.3 (≤168h) | 0.18 else | 0.15 if hours null/<0
goldBonus    = goldPick ? 0.06 : 0
walletSupport= min(walletSupportCount/6, 1) × 0.08

smartScore =
  quality×0.28 + edge×0.14 + conviction×0.22
  + consensusLean×0.12 + urgency×0.20
  + goldBonus + walletSupport
```

Also: `scoreSearchRelevance` / `applySmartSearch` for query ranking (synonym map) — search utility, not a trading strategy.

**UI LOCATION:** Default sort “חכם (קרוב+סבירות)”; home top picks; `smartScore` field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### STRATEGY #8
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**NAME:** Wallet Consensus Playbook  

**INTERNAL NAME:** `getWalletPlaybook` / `walletConsensusScore` / `consensusBySlug`

**STATUS:** IMPLEMENTED + ACTIVE + UI (partial — in-memory; `wallet_consensus` DB table not written by this code path)

**CATEGORY:** G. SMART MONEY / WALLET · E. MARKET SENTIMENT (public activity)

**CODE LOCATION:** `src/lib/wallets/intelligence.ts`

**PIPELINE:**
1. Fetch top `walletLimit` (default 10) from Data API leaderboard (`window=week` then `all`)
2. Fetch last `activityLimit` (default 35; markets service uses 40) activities per wallet
3. Filter BUY trades; bucket entry prices; aggregate per-slug YES/NO size
4. `score = yesSize / (yesSize + noSize)` (or 0.5 if total 0)
5. `supportCount = number of unique wallets` on that slug
6. Attach to markets; feed Strategy #1 factor + Strategy #7 lean/support

**THRESHOLDS used downstream (enrich reason text):** `|score − 0.5| ≥ 0.12` → wallet primary reason.

**Price buckets (analytics labels only):** &lt;35%, 35–55%, 55–75%, ≥75%.

**UI LOCATION:** Wallet support pill on cards; wallets pages (leaderboard separate via `getTopWallets`); insights strings in playbook (not a dedicated strategy picker UI).

**HISTORICAL LEARNING:** Snapshot of recent buys only. **Does not** update model weights from wallet PnL. **NO VERIFIED ONLINE LEARNING LOOP FOUND.**

**KNOWN LIMITATIONS:** `sync-wallets` job only fetches leaderboard count — does not persist consensus. Schema `wallet_consensus` unused by TypeScript writers found.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Ensemble factor cards (components of #1 — not separate strategies)

Documented in Strategy #1 formulas. Status notes:
- `category_prior`: **PARTIAL** — weight active, input always default 0.5 in live enrich
- `volume_momentum` ratio branch: **PARTIAL / UNUSED path** — `previousVolume` never passed
- Others: **IMPLEMENTED + ACTIVE** as factors

---

## 5. MATHEMATICAL FORMULAS

### 5.1 Clamp
`clamp(x) = min(1, max(0, x))` · non-finite → 0 (`clampProbability`)

### 5.2 Factor values
See Strategy #1.

### 5.3 Fair probability
`P_fair = clamp(P_market + (score−0.5)×0.2 + lean×dislocation×0.08)`

### 5.4 Confidence (live scoring)
`C = clamp(0.35 + V_sq×0.25 + V_ld×0.2 + V_pd×0.2)`

### 5.5 Confidence (persist-predictions alternate — DIFFERENT)
`C_persist = min(0.95, max(0.05, 0.45 + edge))`  
where `edge = |edgeScore ?? (fair − marketP)|`  
**File:** `src/server/services/persist-predictions.ts`

### 5.6 Edge
See Strategy #2 (`yesEdge`, favorite lock, etc.).

### 5.7 Quality
See Strategy #3.

### 5.8 Gold
Boolean conjunction — Strategy #5.

### 5.9 Smart score
See Strategy #7.

### 5.10 Wallet consensus
`score = yesSize / (yesSize + noSize)`

### 5.11 Wilson lower bound (display stats only)
Standard Wilson score interval lower bound, `z = 1.96` — `src/lib/analytics/stats.ts` / `src/lib/predictions/statistics.ts`. Used for win-rate strip, **not** for prediction.

### 5.12 Brier / log-loss / ECE
Implemented in libs; **not** wired into scoring or UI production paths found.

### 5.13 Resolution inference
Closed market winner if top outcome price ≥ **0.95**; map to YES/NO by name aliases or binary index.

### 5.14 Dedupe rank
`rank = quality×10 + smartScore + log10(max(1,liq)) + log10(max(1,vol))`

---

## 6. ALL THRESHOLDS & CONSTANTS

| Parameter | Value | Unit | Used By | File |
|---|---|---|---|---|
| price_dislocation weight | 0.18 | weight | heuristic-v1 | config.ts |
| spread_quality weight | 0.16 | weight | heuristic-v1 | config.ts |
| volume_momentum weight | 0.12 | weight | heuristic-v1 | config.ts |
| liquidity_depth weight | 0.16 | weight | heuristic-v1 | config.ts |
| time_decay weight | 0.14 | weight | heuristic-v1 | config.ts |
| wallet_consensus weight | 0.14 | weight | heuristic-v1 | config.ts |
| category_prior weight | 0.10 | weight | heuristic-v1 | config.ts |
| fair adjustment scale | 0.2 | multiplier | estimateFairProbability | scoring.ts |
| lean×dislocation scale | 0.08 | multiplier | estimateFairProbability | scoring.ts |
| confidence base | 0.35 | probability | estimateFairProbability | scoring.ts |
| confidence × spread_quality | 0.25 | weight | estimateFairProbability | scoring.ts |
| confidence × liquidity_depth | 0.20 | weight | estimateFairProbability | scoring.ts |
| confidence × dislocation | 0.20 | weight | estimateFairProbability | scoring.ts |
| min_edge | 0.03 | probability pts | passesFilters | config.ts |
| min_confidence | 0.40 | probability | passesFilters | config.ts |
| min_quality | 0.55 | 0–1 | passesFilters | config.ts |
| max_spread | 0.08 | probability | filters + quality + factors | config.ts |
| min_liquidity | 1000 | USD-like | passesFilters / factors via scoreMarket | config.ts |
| min_volume | 500 | USD-like | passesFilters | config.ts |
| gold_edge | 0.05 | probability pts | isGoldCandidate | config.ts |
| gold_confidence | 0.55 | probability | isGoldCandidate | config.ts |
| gold_quality | 0.70 | 0–1 | isGoldCandidate | config.ts |
| gold_max_hours | 24 | hours | isGoldCandidate | config.ts |
| gold_min_supporting | 4 | count | isGoldCandidate | config.ts |
| gold_min_source_types | 3 | count | isGoldCandidate | config.ts |
| gold supporting factor floor | 0.65 | factor value | isGoldCandidate | gold.ts |
| freeze hours_before_end | 0.25 | hours | shouldFreeze | config.ts |
| freeze max_age_hours | 24 | hours | shouldFreeze | config.ts |
| max_horizon_days | 30 | days | display horizon | config.ts / time-buckets |
| FAVORITE_LOCK | 0.62 | probability | computeEdge | edge.ts |
| MAX_FAVORITE_LOCK | 0.97 | probability | computeEdge | edge.ts |
| MIN_TRADEABLE_WIN | 0.58 | probability | quality-gate | quality-gate.ts |
| MAX_TRADEABLE_WIN | 0.97 | probability | quality-gate / one-sided lock | quality-gate.ts |
| coin-flip bar | 0.62 | winProb | quality-gate | quality-gate.ts |
| ultraNear liquidity floor | 400 | USD-like | quality-gate when winProb&lt;0.62 | quality-gate.ts |
| nearClose minQuality | 42 | /100 | quality-gate | quality-gate.ts |
| far minQuality | 50 | /100 | quality-gate | quality-gate.ts |
| nearClose minLiquidity | 150 | USD-like | quality-gate | quality-gate.ts |
| far minLiquidity | 400 | USD-like | quality-gate | quality-gate.ts |
| far minVolume | 200 | USD-like | quality-gate | quality-gate.ts |
| DAILY_PREDICTION_TARGET | 250 | count | selectDailyPredictions | quality-gate.ts |
| quality weight in smart | 0.28 | weight | computeSmartScore | smart-rank.ts |
| edge weight in smart | 0.14 | weight | computeSmartScore | smart-rank.ts |
| conviction weight | 0.22 | weight | computeSmartScore | smart-rank.ts |
| consensusLean weight | 0.12 | weight | computeSmartScore | smart-rank.ts |
| urgency weight | 0.20 | weight | computeSmartScore | smart-rank.ts |
| goldBonus | 0.06 | score pts | computeSmartScore | smart-rank.ts |
| walletSupport scale | support/6 × 0.08 | score | computeSmartScore | smart-rank.ts |
| edge×8 cap | min(\|e\|×8,1) | score | computeSmartScore | smart-rank.ts |
| enrich supporting reason floor | 0.60 | factor | enrich primaryReason | enrich.ts |
| enrich risk factor floor | 0.45 | factor | enrich primaryRisk | enrich.ts |
| wallet reason lean | 0.12 | \|score−0.5\| | enrich | enrich.ts |
| winProb reason floor | 0.70 | probability | enrich | enrich.ts |
| resolution unclear desc length | 40 | chars | enrich | enrich.ts |
| resolution winner price | 0.95 | probability | inferMarketResolution | resolution.ts |
| freshness freshMs | 120000 | ms | classifyFreshness | freshness.ts |
| freshness delayedMs | 900000 | ms | classifyFreshness | freshness.ts |
| freshness staleMs | 3600000 | ms | classifyFreshness | freshness.ts |
| wallet playbook cache | 300000 | ms | getWalletPlaybook | intelligence.ts |
| universe cache | 45000 | ms | fetchActivePredictionUniverse | api.ts |
| persist confidence base | 0.45+edge | probability | persist-predictions | persist-predictions.ts |
| user_preferences.min_edge default (DB) | 0.05 | — | schema only | migrations |
| user_preferences.min_confidence default (DB) | 0.5 | — | schema only | migrations |
| seed min_edge (DEV) | 0.04 | — | seed only; not loaded by live code | seed.sql |

---

## 7. MARKET FILTERS

### Universe fetch (Gamma multi-lane)
| FILTER | VALUE | CODE LOCATION | PURPOSE |
|---|---|---|---|
| active | true | `fetchActivePredictionUniverse` | Open markets only |
| closed | false | same | Exclude closed from active lanes |
| endDate windows | 0–2h, 0–5h, 0–24h, 0–30d vol, 0–7d liq | same | Emphasize near-close + depth |
| cache | 45s | same | Reduce API load |

### Display horizon
| FILTER | VALUE | CODE LOCATION | PURPOSE |
|---|---|---|---|
| beyond_30d | excluded | `isWithinDisplayHorizon` | max_horizon_days=30 |
| closed bucket | excluded | same | No closed in active cards |
| active === false | excluded | `filterDisplayMarkets` / `filterMarkets` | Inactive out |

### Model emit filter (Strategy #4)
See §6 min_edge/confidence/quality/spread/liquidity/volume.

### Daily quality gate (Strategy #6)
See Strategy #6 entry conditions — this is what users actually see on `/markets`.

### Gold filter (Strategy #5)
See Strategy #5.

### Other
| FILTER | VALUE | CODE LOCATION | PURPOSE |
|---|---|---|---|
| Missing YES price | null scores | enrich.ts | Cannot score |
| Sports moneyline NO | reject | quality-gate | Avoid useless NO labels |
| One-sided ≥98% | reject | quality-gate / isOneSidedLock | No tradable payout |
| Dedupe | one per conditionId/slug/event key | dedupe.ts | Unique cards |
| Event dedupe (alt path) | one per eventId | filter.ts `dedupeByEvent` | Orphan server path |
| Category UI filter | Politics/Sports/Crypto/Business | market-filters + services | User filter |
| Horizon UI filter | 2h/5h/24h/3d/7d/30d | services filterMarkets | User filter |
| goldOnly | goldPick true | services | Gold page |
| History trackedOnly | recorded sides only | closed-stats | Honest win rate |

---

## 8. SIGNAL PIPELINE

```
DATA
  Polymarket Gamma multi-lane universe (+ optional Supabase markets)
  + Data API top-wallet activity → consensusBySlug
↓
MARKET FILTERING
  active, not closed, within 30d horizon
↓
FEATURE EXTRACTION
  computeFactors (7 factors)
↓
PROBABILITY ESTIMATION
  estimateFairProbability → P_fair, confidence
↓
EDGE CALCULATION
  computeEdge → side, edge, win_probability
↓
CONFIDENCE CALCULATION
  (same step as fair P; alternate formula on DB persist)
↓
QUALITY / RISK ASSESSMENT
  computeQuality; freeze check; passesFilters; isGoldCandidate
↓
ENRICHMENT
  edgeScore, qualityScore, selectedOutcome, goldPick, primaryReason/Risk, smartScore
↓
SIGNAL GENERATION / CHAMPION SET
  isQualityPrediction → selectDailyPredictions (≤~250+, near-close first)
↓
RANKING
  sort smart | edge | quality | volume | liquidity | endDate | relevance
↓
RECOMMENDATION
  UI cards / Gold page / Top picks / persistChampionPredictions + history
```

App is **analysis-only** — no trade execution, no stake recommendation.

---

## 9. STRATEGY INTERACTIONS

```
Wallet Consensus (#8)
    ↓ factor + lean + smartScore support
Heuristic factors (#1)
    ↓
Fair P + Confidence (#1)
    ↓
Edge/Side (#2) ──→ edgeScore, selectedOutcome
    ↓
Quality (#3)
    ↓
passesFilters (#4) ──┐
Gold (#5) ───────────┴→ is_gold / goldPick (requires both)
    ↓
Smart Rank (#7) uses quality, |edge|, winProb, urgency, gold, wallet
    ↓
Daily Quality Gate (#6) filters & orders champions for UI/history
```

**No voting ensemble of independent strategies.** Single model + layered gates.  
**Vetoes:** sports moneyline NO; one-sided locks; gold freshness/conflict; freeze for `should_emit`.

**Weighting:** Fixed in `HEURISTIC_V1` (not adaptive).

---

## 10. HISTORICAL LEARNING

| Mechanism | Exists? | Affects future predictions? |
|---|---|---|
| Record open picks / resolve closed | YES (`prediction-store`, cron) | NO — stats/history only |
| Win rate + Wilson display | YES | NO |
| Brier / calibration / log-loss libs | YES (unused in prod path) | NO |
| category_prior from history | Schema/weight only | NO — input never supplied |
| Adaptive model weights | NO | — |
| Feedback from wallet PnL into weights | NO | — |
| DB `model_versions.configuration` loaded at runtime | NO (`HEURISTIC_V1` hardcoded) | — |

**Verdict: NO VERIFIED ONLINE LEARNING LOOP FOUND.**

---

## 11. BACKTESTING

| Question | Finding |
|---|---|
| Dedicated backtesting engine? | **NOT VERIFIED / NOT FOUND** |
| Historical replay with fees/slippage? | **NOT FOUND** |
| What exists instead? | Forward recording of live champions + post-resolution grading; `scripts/sync-prediction-history.ts` rebuilds durable JSON from live enrich+quality gate |
| Position sizing in backtest? | N/A — no backtester |
| Performance metrics | Win rate, Wilson LB; Brier/logloss available but unused in UI |

---

## 12. UNUSED / DEAD / DEPRECATED

| Item | Status | Evidence |
|---|---|---|
| `src/server/services/markets.ts` (`listScoredMarkets`) | UNUSED orphan | No imports outside its file |
| `prediction_factors` inserts | UNUSED | Table in migration; no TS writer found |
| `user_preferences.min_edge` / `min_confidence` | SCHEMA ONLY | Not read by scoring |
| `parseHeuristicConfig` / DB seed weights | NOT APPLIED LIVE | Live always `HEURISTIC_V1` |
| Seed configuration values | DEV ONLY; diverge from code defaults | seed.sql vs config.ts |
| `previousVolume` momentum branch | DEAD PATH | Never passed from enrich |
| Live `categoryPrior` | DEAD INPUT | Always default 0.5 |
| Brier / calibrationCurve / ECE | LIB ONLY | Only tests / unused analytics |
| `should_emit` as Markets list gate | COMPUTED BUT NOT USED FOR UI LIST | UI uses quality-gate |
| `wallet_consensus` table writes | NOT FOUND in jobs/services | In-memory playbook only |
| `sync-wallets` persistence of consensus | PARTIAL | Fetches leaderboard; no consensus upsert |

---

## 13. UI STRATEGIES VS REAL IMPLEMENTATION

| UI claim / control | Implementation status |
|---|---|
| “מודל השווקים” / heuristic-v1 | **A. Fully implemented** (#1–#3) |
| Edge / הסתברות מודל / ציון איכות | **A. Fully implemented** (with favorite-lock nuance) |
| Gold picks | **A. Fully implemented** + permission gate |
| 250+ quality predictions / 2h & 5h emphasis | **A. Fully implemented** (#6 + universe lanes) |
| Sort: smart / edge / quality / volume / liquidity / endDate | **A. Implemented** |
| Wallet support count pill | **A/B** — live playbook; not durable DB consensus |
| “מודל הארנקים” | **B. Partial** — leaderboard + lookup + consensus feed; not a separate prediction model |
| אחוז הצלחה / צדקנו / Wilson | **A** as historical grade display — **not** a strategy |
| Pricing: Core/Gold feature lists | Marketing; Gold filter real |
| Separate named strategies (momentum/arbitrage/Kelly) | **C. Not present as UI labels**; momentum only as factor name in code |

No case found of a UI strategy **label** with zero code (**UI ONLY = 0**).

---

## 14. CRITICAL FINDINGS

1. **Single model, many layers** — Do not confuse quality-gate, gold, smart-rank, and factors as separate competing prediction models.
2. **Dual filter systems** — `passesFilters` (min quality 0.55 / liq 1000 / vol 500 / edge 0.03) vs `isQualityPrediction` (quality 42–50 / liq 150–400 / tradable band). UI uses the latter.
3. **Dual confidence formulas** — scoring vs `persist-predictions` (`0.45+edge`). DB confidence may disagree with scored confidence.
4. **Favorite lock ≠ pure edge** — Side often follows market favorite 62–97%; edge can be `P−0.5` rather than `P_fair−P_market`.
5. **Config drift** — `supabase/seed.sql` weights/thresholds ≠ `HEURISTIC_V1`; runtime ignores DB config.
6. **category_prior / previousVolume inert** in live enrich path.
7. **`listScoredMarkets` orphan** — alternate scoring without wallet consensus / without quality-gate.
8. **No position sizing / Kelly / exposure limits** — analysis product only.
9. **No online learning** — history does not change future fair probabilities.
10. **No backtester** — only forward paper tracking of champions.
11. **Spread often null** — quality/spread_quality degrade to defaults.
12. **Gold rarity** — empty-state message explicitly refuses to lower thresholds.
13. **Sports moneyline NO suppressed** in quality gate — intentional selection bias.
14. **`prediction_factors` never persisted** despite schema — factor explainability not durable in DB.
15. **Win rate can be empty** — honest empty sample preferred over simulated post-close grades.

---

## 15. FINAL SOURCE MAP

```
STRATEGY #1 Heuristic-v1
  → FILE: src/lib/predictions/config.ts, factors.ts, scoring.ts, enrich.ts
  → FUNCTION: computeFactors, estimateFairProbability, scoreMarket, enrichMarketWithHeuristic
  → API: none public; used by server components & cron/run-model
  → DATABASE: model_versions (name/version); predictions.fair_probability (on persist)
  → UI: /markets cards (מודל), /markets/[slug], home disclaimer
  → OUTPUT: fair_probability, confidence, factors

STRATEGY #2 Edge & Side
  → FILE: src/lib/predictions/edge.ts
  → FUNCTION: computeEdge
  → API: n/a
  → DATABASE: predictions.edge, predictions.side
  → UI: Edge pill, detail Edge, sort=edge
  → OUTPUT: side, edge, win_probability

STRATEGY #3 Quality
  → FILE: src/lib/predictions/quality.ts
  → FUNCTION: computeQuality, qualityToScore100
  → DATABASE: predictions.quality_score
  → UI: “ציון” pill
  → OUTPUT: quality_score_100

STRATEGY #4 Emit Filter
  → FILE: src/lib/predictions/filter.ts
  → FUNCTION: passesFilters
  → API: n/a
  → DATABASE: reject_reasons not stored; gates should_emit / gold conjunction
  → UI: not labeled
  → OUTPUT: { ok, reasons }

STRATEGY #5 Gold
  → FILE: src/lib/predictions/gold.ts
  → FUNCTION: isGoldCandidate
  → API: getGoldMarkets service
  → DATABASE: predictions.is_gold
  → UI: /gold, badges
  → OUTPUT: goldPick boolean

STRATEGY #6 Daily Quality Gate
  → FILE: src/lib/markets/quality-gate.ts
  → FUNCTION: isQualityPrediction, selectDailyPredictions
  → API: getMarkets filter path
  → DATABASE: champion rows via persistChampionPredictions / history JSON
  → UI: /markets default list, home top picks subset
  → OUTPUT: ordered Market[]

STRATEGY #7 Smart Rank
  → FILE: src/lib/markets/smart-rank.ts
  → FUNCTION: computeSmartScore, applySmartSearch
  → UI: sort=smart (default)
  → OUTPUT: smartScore

STRATEGY #8 Wallet Consensus
  → FILE: src/lib/wallets/intelligence.ts
  → FUNCTION: getWalletPlaybook, attachWalletConsensus
  → API: Polymarket Data API leaderboard + activity
  → DATABASE: intended wallet_consensus (writes NOT VERIFIED in TS)
  → UI: wallet count pill; feeds model/rank
  → OUTPUT: consensusBySlug { score, supportCount, yesSize, noSize }
```

### Cron / jobs map
| Job | Route | Strategy role |
|---|---|---|
| run-model | `/api/cron/run-model` | Persist champions (#1–#6 outputs) |
| check-resolutions | `/api/cron/check-resolutions` | Grade history (not predict) |
| sync-markets / sync-prices | cron | Data freshness |
| sync-wallets | cron | Leaderboard fetch only |

---

## Appendix A — Second-pass miss check

Second recursive search for strategy-related terms covered all files under
`src/lib/predictions`, `src/lib/markets`, `src/lib/wallets`, `src/services`,
`src/server`, `supabase`, `scripts`, and tests. **No additional independent
trading strategies** (Kelly, arbitrage, mean reversion, ML ensemble, stake
sizing) were found beyond the eight algorithms inventoried above.

Items explicitly searched and **not found as implementations:**  
Kelly, fractional Kelly, arbitrage, mean reversion (as strategy), stake/position
sizing, max exposure, stop loss, correlated-market risk, adaptive weight training,
backtest engine with fees/slippage.

---

## Appendix B — Duplicate naming

| Names | Relationship |
|---|---|
| Edge / edgeScore / predictions.edge / “ציון Edge” | **Same family** — from `computeEdge` (UI shows abs) |
| Quality / qualityScore / quality_score / “ציון” | **Same** — `computeQuality` |
| Gold / goldPick / is_gold / Gold page | **Same** — `isGoldCandidate` + filter.ok |
| Fair probability / modelProbability / הסתברות מודל | **Same** — `fair_probability` |
| Wallet consensus score / walletConsensusScore / factor wallet_consensus | **Same signal**, used as factor + rank input |
| `passesFilters` vs `isQualityPrediction` | **Different** gates (similar intent, different thresholds) |
| Confidence in scoring vs persist | **Different formulas** (duplicate concept, divergent math) |
| `server/services/markets.ts` vs `services/markets.ts` | **Similar scoring idea**; only `services/markets.ts` is live UI path |

Do **not** merge Edge with Quality or Gold — different calculations.

---

*End of forensic inventory. No code was modified as part of the extraction
beyond adding this documentation file.*
