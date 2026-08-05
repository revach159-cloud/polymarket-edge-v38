# Security

## עקרונות

1. אין סודות בצד לקוח (`NEXT_PUBLIC_*` רק לערכים ציבוריים).
2. `SUPABASE_SERVICE_ROLE_KEY` — Server בלבד.
3. הרשאות נבדקות בשרת, ב־Server Actions, ב־Route Handlers וב־RLS.
4. הודעות שגיאה בעברית בלי חשיפת stack/secrets.
5. מניעת User Enumeration במסכי auth.
6. מניעת Open Redirect אחרי login.

## RLS (סיכום)

| טבלה | מדיניות |
|------|---------|
| profiles | קריאה/עדכון עצמי; אין שינוי role/plan |
| favorites | בעלות מלאה |
| user_preferences | בעלות מלאה |
| subscriptions | קריאה עצמית בלבד |
| markets/snapshots/predictions/wallets | קריאה ציבורית; כתיבה service role |
| audit_logs | קריאת admin; אין עדכון משתמש |
| system_health | קריאה מוגבלת; כתיבה service role |

## Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` מצמצמת
- CSP בסיסית (מותאמת ל־Next + Supabase + Polymarket)

## Cron

`Authorization: Bearer $CRON_SECRET` חובה.

## Stripe

Webhook עם אימות חתימה + idempotency. Success URL אינו הוכחת תשלום.

## Checklist לפני פרודקשן

- [ ] RLS מופעל על כל הטבלאות
- [ ] אין service role ב־client bundle
- [ ] Google OAuth redirect URLs נכונים
- [ ] CRON_SECRET חזק
- [ ] Admin role רק ידנית ב־DB
