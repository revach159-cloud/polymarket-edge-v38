# Deployment — Vercel

## דרישות מוקדמות

1. פרויקט Supabase מוכן + migrations רצו.
2. משתני סביבה ב־Vercel (Production + Preview).
3. Repository מחובר ל־Vercel; Production מ־`main` בלבד.

## משתני סביבה חובה

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

אופציונלי: Stripe, Sentry, Google (מוגדר בעיקר ב־Supabase Auth providers).

## Supabase Auth URLs

Site URL: `https://YOUR_DOMAIN`

Redirect URLs:
- `https://YOUR_DOMAIN/auth/callback`
- `http://localhost:3000/auth/callback`

## Google OAuth

1. Google Cloud Console → OAuth Client
2. Authorized redirect: `https://<project-ref>.supabase.co/auth/v1/callback`
3. הכנס Client ID/Secret ב־Supabase → Authentication → Providers → Google

## Cron

מוגדר ב־`vercel.json` (לוחות זמנים ל־Edge Lab: `*/15`, `*/30`, שעתי). כל קריאה חייבת לכלול:

`Authorization: Bearer $CRON_SECRET`

### מגבלת Vercel Hobby

חשבון **Hobby** מאפשר Cron יומי בלבד. הביטויים ב־`vercel.json` (`*/15 * * * *` וכד׳) דורשים **Pro** — אחרת הפריסה נכשלת עם שגיאת Cron, גם ב־Preview.

זה אינו באג של מסלול `/academy`. אפשרויות לבעלים בלבד:

1. שדרוג Vercel ל־Pro (שומר על קצב הסנכרון המתוכנן), או  
2. אישור מפורש להוריד את לוחות הזמנים ב־`vercel.json` ל־cron יומי (משנה את התנהגות Edge Lab בפרודקשן).

## Stripe (אופציונלי)

Webhook: `https://YOUR_DOMAIN/api/stripe/webhook`  
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Smoke Test אחרי פריסה

1. `GET /api/health` → status ok
2. דף הבית נטען בעברית RTL
3. `/markets` מציג שווקים אמיתיים או שגיאה מנוהלת
4. הרשמה + התחברות
5. Free לא נכנס ל־`/gold` תוכן
6. `/admin` חסום למשתמש רגיל
7. אין secrets ב־View Source / Network client
