# Polymarket Edge Lab — תוכנית עבודה

מערכת מודיעין וניתוח לשווקי Polymarket הציבוריים. מידע וניתוח בלבד — ללא מסחר.

## סטטוס שלבים

- [x] שלב 1 — Foundation (Next.js 16, TypeScript strict, Tailwind 4, RTL, Theme, Routing, Docs)
- [x] שלב 2 — Supabase (Clients, Migrations, RLS, Types, Seed, Profile trigger)
- [x] שלב 3 — Authentication (Pages, callback, middleware, account/admin gates)
- [x] שלב 4 — Polymarket Data (Gamma/CLOB/Data API, schemas, mappers, freshness)
- [x] שלב 5 — Prediction Engine (heuristic-v1, factors, edge, quality, gold, freeze)
- [x] שלב 6 — Wallet Analysis (public leaderboard/activity/positions)
- [x] שלב 7 — UI/UX (Home, Markets, Gold, Wallets, Stats, Pricing, Auth, Admin, Legal)
- [x] שלב 8 — Security (RLS SQL, headers, cron secret, safe redirects, permissions)
- [x] שלב 9 — Testing (Unit 12 passed, E2E smoke specs, typecheck, production build)
- [x] שלב 10 — Deployment (vercel.json crons, DEPLOYMENT.md, README, .env.example)

## תוצאות פקודות (מקומי)

- `npm run test` — עבר (12 בדיקות)
- `npm run typecheck` — עבר
- `npm run build` — עבר (webpack)

## נותר ידנית למשתמש

1. יצירת פרויקט Supabase + הרצת migration
2. מילוי `.env.local` / Vercel env
3. Google OAuth ב־Supabase
4. (אופציונלי) Stripe / Sentry
5. פריסה ל־Vercel מהענף הראשי
