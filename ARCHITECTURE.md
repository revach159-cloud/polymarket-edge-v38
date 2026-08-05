# Architecture — Polymarket Edge Lab

## סקירה

ארכיטקטורת שכבות ברורה:

```
UI (App Router / Server Components)
  → Server Actions & Route Handlers
    → Domain Services (predictions, wallets, markets)
      → Repositories (Supabase)
      → Polymarket Adapters (Gamma / CLOB / Data / WS)
```

רכיבי UI אינם קוראים ישירות ל־Polymarket.

## שכבות

| שכבה | נתיב | אחריות |
|------|------|--------|
| UI | `src/app`, `src/components` | תצוגה RTL, מצבי loading/empty/error |
| Auth | `src/lib/auth` | Supabase SSR cookies, session |
| Permissions | `src/lib/permissions` | free/core/gold/admin |
| Polymarket | `src/lib/polymarket` | HTTP client, Zod, mappers, freshness |
| Predictions | `src/lib/predictions` | heuristic-v1, edge, quality, gold |
| Jobs | `src/server/jobs` | Sync, model runs, resolution |
| API | `src/app/api` | health, cron, stripe webhook (opt) |

## נתונים

- **Gamma** — discovery (events/markets/tags/slugs)
- **CLOB** — prices, book, midpoint, spread, history
- **Data API** — public wallet activity/positions
- **WebSocket** — live prices (singleton, fallback REST)

## Freshness

`fresh` | `delayed` | `stale` | `unavailable` — מוצג למשתמש; אין להציג stale כ־live.

## Cron (Vercel)

| Job | תדירות מומלצת |
|-----|----------------|
| sync-markets | כל 15 דקות |
| sync-prices | כל 15 דקות |
| run-model | כל 30 דקות |
| check-resolutions | כל 30 דקות |
| sync-wallets | כל שעה |

מוגן ב־`CRON_SECRET`.

## אבטחה

- RLS על כל טבלאות המשתמש
- בדיקות הרשאה בשרת + API + RLS
- Service role רק בשרת
- Security headers ב־`next.config.ts` / `vercel.json`
