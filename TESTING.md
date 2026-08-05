# Testing

## כלים

- **Vitest** — unit + integration קלות
- **Playwright** — E2E
- **npm run check** — format + lint + typecheck + unit + build

## Unit (חובה)

Time buckets, countdown, filtering/sorting, edge, quality score, penalties, Wilson, Brier, Log Loss, calibration, freshness, permissions, Zod schemas, mappers, dedupe.

## Integration

Auth flows, favorites, RLS expectations (עם Supabase מקומי או mocks), cron auth, prediction freeze, resolution update.

## E2E

Home, mobile nav, auth screens, markets filters, market detail, favorites (auth), Gold gate, Admin gate, health, no horizontal scroll at 320/375, external Polymarket link `rel=noopener`.

## כללים

- Mock רק בבדיקות.
- אין `@ts-ignore` / השבתת ESLint כדי "לעבור".
- אין Win Rate מפוברק בפרודקשן.

## הרצה

```bash
npm run test
npm run test:e2e
npm run check
```
