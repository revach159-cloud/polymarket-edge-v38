# Polymarket Edge Lab

מערכת מודיעין וניתוח לשווקי החיזוי הציבוריים של Polymarket.

**מידע וניתוח בלבד.** המערכת אינה מבצעת עסקאות, אינה מחזיקה כספים, אינה מבקשת Private Keys, ואינה מהווה ייעוץ פיננסי או הבטחת רווח.

## כתובות האתר

**כתובת קבועה (Production):**
- אתר: https://polymarket-daily-edge.vercel.app
- שווקים: https://polymarket-daily-edge.vercel.app/markets
- סטטיסטיקה: https://polymarket-daily-edge.vercel.app/statistics

`localhost:3000` ו־`*.trycloudflare.com` הם רק לפיתוח מקומי/זמני — לא כתובת האתר.

## טכנולוגיות

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · Supabase (Auth/Postgres/RLS) · Zod · React Hook Form · TanStack Table · Recharts · Vitest · Playwright · Vercel

## דרישות

- Node.js 20+
- npm
- חשבון Supabase (ל־Auth ו־DB)
- (אופציונלי) Google OAuth, Stripe, Sentry

## התקנה

```bash
cd polymarket-edge-lab
npm install
cp .env.example .env.local
```

מלאו ב־`.env.local` לפחות:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
```

## Supabase

1. צרו פרויקט חדש ב־Supabase.
2. הריצו את המיגרציה: `supabase/migrations/20260322000000_init.sql` (SQL Editor או CLI).
3. (פיתוח בלבד) הריצו `supabase/seed.sql`.
4. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect: `http://localhost:3000/auth/callback`
5. (אופציונלי) הפעילו Google Provider.

## הרצה מקומית

```bash
npm run dev
```

פתחו http://localhost:3000

בלי Supabase האתר עדיין מציג שווקים חיים מ־Polymarket Gamma (קריאה ציבורית). Auth/Favorites דורשים Supabase.

## בדיקות

```bash
npm run test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
npm run check
```

## פריסה ל־Vercel

ראו `DEPLOYMENT.md`. חובה להגדיר משתני סביבה + Cron Secret + Supabase redirect URLs לדומיין הפרודקשן.

## מודל

`heuristic-v1` — מודל היוריסטי שקוף. **אינו Machine Learning** ואינו מבטיח הצלחה. Quality Score אינו אחוז הצלחה.

## מסמכים

- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `TESTING.md`
