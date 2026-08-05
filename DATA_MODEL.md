# Data Model

## טבלאות עיקריות

### profiles
פרופיל משתמש מקושר ל־`auth.users`. שדות: role (`free|core|gold|admin`), plan, language, timezone, onboarding_completed. משתמש רגיל לא מעדכן role/plan דרך RLS.

### markets
שווקים מסונכרנים מ־Polymarket. Unique על `polymarket_market_id` ועל `slug`. אינדקסים על `close_time`, `category`, `active`, `closed`.

### market_snapshots
צילומי מחיר/נזילות לאורך זמן. Retention ל־snapshots ישנים (למשל 90 יום) בלי למחוק predictions/statistics.

### model_versions / model_runs
גרסאות מודל (heuristic-v1) והרצות. משקלים ב־`configuration` JSON — לא ב־UI.

### predictions / prediction_factors
פרדיקשן מוקפא + גורמים (raw/normalized/weight/contribution/explanation/source). אסור לעדכן רשומה היסטורית אחרי freeze.

### wallets / wallet_positions / wallet_consensus
ניתוח פעילות ציבורית בלבד. קונצנזוס רק כשעומדים בכללי איכות.

### favorites / user_preferences / subscriptions
נתוני משתמש פרטיים — RLS: בעלות בלבד.

### audit_logs / system_health
Admin/backend. Audit immutable למשתמש רגיל.

## מגבלות חשובות

- Unique: אין market כפול, אין favorite כפול `(user_id, market_id)`.
- Check: הסתברויות 0–1, quality 0–100, outcomes YES|NO.
- Timestamps ב־UTC עם `timestamptz`.
- Trigger `set_updated_at` על טבלאות עם `updated_at`.

## Seed

`supabase/seed.sql` — פיתוח בלבד. לא רץ אוטומטית בפרודקשן.
