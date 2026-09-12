# Crypto Setup Pro — Precision Crypto Engine

Live product: https://crypto-setup-pro.vercel.app

This folder is a **source-of-truth checkout reconstructed from the live app**, plus a
**shadow intelligence layer** adapted from Polymarket Daily Edge transferable ideas.

## Rules

| Engine | Role |
|---|---|
| **V1** (`src/engine-v1.js`) | **PROTECTED PRODUCTION** — same gates, score, labels as live baseline |
| **V2 Shadow** (`src/shadow.js`) | Advisory only — quality / smart-rank / premium / data-gate / calibration |

Shadow **never** changes LONG/SHORT/WATCH/NEAR/NO TRADE labels.

## What was imported (adapted)

- Data quality / freshness gate  
- Quality composite (spread, turnover, volume, gate stability)  
- Premium (“Gold-like”) flag as stricter overlay  
- Smart-rank overlay  
- Agreement / conflict explainability  
- Wilson + score-bucket calibration analytics  

## What was rejected

- Polymarket YES/NO favorite-lock  
- Resolution / time-to-close freeze  
- Polymarket wallet consensus API  
- Replacing V1 Edge score with heuristic-v1 fair probability  

## Run locally

```bash
cd crypto-setup-pro
npm test
npm run serve
# open http://localhost:4173
```

## Deploy (Vercel)

Set project **Root Directory** to `crypto-setup-pro` (static).  
Or deploy this folder as its own project.

## Baseline performance

Journal lives in browser `localStorage` (`precision_journal_v3`).  
Use **ייצוא מאגר** to export real outcomes. Until then:

**INSUFFICIENT DATA FOR VALIDATION** for win rate / ROI claims.

## Docs

- Integration plan: `../docs/CRYPTO_SETUP_PRO_INTEGRATION_PLAN.md`
- Polymarket strategy inventory: `../docs/STRATEGY_INVENTORY.md`
