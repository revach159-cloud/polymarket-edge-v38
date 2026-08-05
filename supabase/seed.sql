-- =============================================================================
-- DEV ONLY SEED — do not run against production
-- =============================================================================
-- Auth users are NOT created here. Create them via Supabase Auth UI / CLI, e.g.:
--   supabase auth signup --email dev@example.com --password 'dev-password-change-me'
-- Then promote to admin in SQL:
--   update public.profiles set role = 'admin', plan = 'gold' where email = 'dev@example.com';
-- =============================================================================

-- heuristic-v1 model version
insert into public.model_versions (name, version, description, configuration, is_active)
values (
  'heuristic-v1',
  '1.0.0',
  'DEV seed: baseline heuristic edge model',
  '{
    "weights": {
      "price_dislocation": 0.28,
      "spread_quality": 0.12,
      "volume_momentum": 0.15,
      "liquidity_depth": 0.10,
      "time_decay": 0.12,
      "wallet_consensus": 0.18,
      "category_prior": 0.05
    },
    "thresholds": {
      "min_edge": 0.04,
      "min_confidence": 0.45,
      "min_quality": 0.40,
      "gold_edge": 0.08,
      "gold_confidence": 0.65,
      "gold_quality": 0.70,
      "max_spread": 0.08,
      "min_liquidity": 500,
      "min_volume": 1000
    },
    "freeze": {
      "hours_before_end": 2,
      "max_age_hours": 24
    },
    "freshness": {
      "stale_after_minutes": 30,
      "critical_after_minutes": 120
    }
  }'::jsonb,
  true
)
on conflict (name, version) do update
set
  configuration = excluded.configuration,
  is_active = excluded.is_active,
  description = excluded.description,
  updated_at = now();

-- Sample DEV markets (clearly labeled)
insert into public.markets (
  polymarket_id,
  slug,
  question,
  description,
  category,
  tags,
  status,
  yes_price,
  no_price,
  volume,
  liquidity,
  end_date,
  metadata
)
values
  (
    'dev-market-btc-100k-2026',
    'dev-btc-above-100k-2026',
    '[DEV] Will Bitcoin be above $100k by end of 2026?',
    'DEV ONLY seed market — not a real Polymarket listing.',
    'crypto',
    array['dev', 'crypto', 'bitcoin'],
    'active',
    0.42,
    0.58,
    125000,
    18000,
    '2026-12-31T23:59:59Z',
    '{"dev": true, "seed": true}'::jsonb
  ),
  (
    'dev-market-fed-cut-q2',
    'dev-fed-rate-cut-q2-2026',
    '[DEV] Will the Fed cut rates in Q2 2026?',
    'DEV ONLY seed market — not a real Polymarket listing.',
    'economics',
    array['dev', 'fed', 'rates'],
    'active',
    0.55,
    0.45,
    89000,
    12000,
    '2026-06-30T23:59:59Z',
    '{"dev": true, "seed": true}'::jsonb
  ),
  (
    'dev-market-eth-etf-flows',
    'dev-eth-etf-positive-flows',
    '[DEV] Will ETH spot ETF net flows be positive this month?',
    'DEV ONLY seed market — not a real Polymarket listing.',
    'crypto',
    array['dev', 'eth', 'etf'],
    'active',
    0.61,
    0.39,
    45000,
    7500,
    (now() + interval '20 days'),
    '{"dev": true, "seed": true}'::jsonb
  ),
  (
    'dev-market-resolved-sample',
    'dev-resolved-sample',
    '[DEV] Sample resolved market (YES)',
    'DEV ONLY resolved seed market for calibration testing.',
    'misc',
    array['dev', 'resolved'],
    'resolved',
    1.0,
    0.0,
    10000,
    0,
    now() - interval '7 days',
    '{"dev": true, "seed": true}'::jsonb
  )
on conflict (polymarket_id) do update
set
  question = excluded.question,
  description = excluded.description,
  yes_price = excluded.yes_price,
  no_price = excluded.no_price,
  volume = excluded.volume,
  liquidity = excluded.liquidity,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

-- Mark resolved sample
update public.markets
set resolved_outcome = 'yes', resolved_at = now() - interval '6 days'
where polymarket_id = 'dev-market-resolved-sample';

-- system_health rows for cron jobs
insert into public.system_health (service_name, status, metadata)
values
  ('sync-markets', 'idle', '{"dev": true}'::jsonb),
  ('sync-prices', 'idle', '{"dev": true}'::jsonb),
  ('run-model', 'idle', '{"dev": true}'::jsonb),
  ('check-resolutions', 'idle', '{"dev": true}'::jsonb),
  ('sync-wallets', 'idle', '{"dev": true}'::jsonb),
  ('api', 'healthy', '{"dev": true}'::jsonb)
on conflict (service_name) do update
set
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();
