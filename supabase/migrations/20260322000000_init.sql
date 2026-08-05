-- Polymarket Edge Lab — initial schema
-- Roles: free | core | gold | admin
-- Plans: free | core | gold

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'free'
    check (role in ('free', 'core', 'gold', 'admin')),
  plan text not null default 'free'
    check (plan in ('free', 'core', 'gold')),
  timezone text default 'UTC',
  locale text default 'he',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_plan_idx on public.profiles (plan);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'free',
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- markets
-- ---------------------------------------------------------------------------

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  polymarket_id text not null,
  condition_id text,
  slug text,
  question text not null,
  description text,
  category text,
  tags text[] default '{}',
  status text not null default 'active'
    check (status in ('active', 'closed', 'resolved', 'archived')),
  outcome_prices numeric[] default '{}',
  yes_price numeric check (yes_price is null or (yes_price >= 0 and yes_price <= 1)),
  no_price numeric check (no_price is null or (no_price >= 0 and no_price <= 1)),
  volume numeric default 0 check (volume >= 0),
  liquidity numeric default 0 check (liquidity >= 0),
  open_interest numeric default 0,
  end_date timestamptz,
  resolved_at timestamptz,
  resolved_outcome text check (resolved_outcome is null or resolved_outcome in ('yes', 'no', 'unknown')),
  clob_token_ids text[] default '{}',
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint markets_polymarket_id_unique unique (polymarket_id)
);

create index markets_status_idx on public.markets (status);
create index markets_end_date_idx on public.markets (end_date);
create index markets_category_idx on public.markets (category);
create index markets_last_synced_at_idx on public.markets (last_synced_at);
create index markets_slug_idx on public.markets (slug);

create trigger markets_set_updated_at
  before update on public.markets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- market_snapshots
-- ---------------------------------------------------------------------------

create table public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  yes_price numeric check (yes_price is null or (yes_price >= 0 and yes_price <= 1)),
  no_price numeric check (no_price is null or (no_price >= 0 and no_price <= 1)),
  volume numeric default 0,
  liquidity numeric default 0,
  open_interest numeric default 0,
  best_bid numeric,
  best_ask numeric,
  spread numeric,
  snapshot_at timestamptz not null default now(),
  source text not null default 'clob',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index market_snapshots_market_id_idx on public.market_snapshots (market_id);
create index market_snapshots_snapshot_at_idx on public.market_snapshots (snapshot_at desc);
create unique index market_snapshots_market_snapshot_unique
  on public.market_snapshots (market_id, snapshot_at);

-- ---------------------------------------------------------------------------
-- model_versions
-- ---------------------------------------------------------------------------

create table public.model_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  description text,
  configuration jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint model_versions_name_version_unique unique (name, version)
);

create index model_versions_is_active_idx on public.model_versions (is_active)
  where is_active = true;

create trigger model_versions_set_updated_at
  before update on public.model_versions
  for each row execute function public.set_updated_at();

-- Only one active version per name
create or replace function public.ensure_single_active_model_version()
returns trigger
language plpgsql
as $$
begin
  if new.is_active then
    update public.model_versions
    set is_active = false
    where name = new.name
      and id <> new.id
      and is_active = true;
  end if;
  return new;
end;
$$;

create trigger model_versions_single_active
  before insert or update of is_active on public.model_versions
  for each row
  when (new.is_active = true)
  execute function public.ensure_single_active_model_version();

-- ---------------------------------------------------------------------------
-- model_runs
-- ---------------------------------------------------------------------------

create table public.model_runs (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references public.model_versions (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  markets_processed integer not null default 0 check (markets_processed >= 0),
  predictions_created integer not null default 0 check (predictions_created >= 0),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index model_runs_model_version_id_idx on public.model_runs (model_version_id);
create index model_runs_status_idx on public.model_runs (status);
create index model_runs_created_at_idx on public.model_runs (created_at desc);

create trigger model_runs_set_updated_at
  before update on public.model_runs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- predictions
-- ---------------------------------------------------------------------------

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  model_run_id uuid references public.model_runs (id) on delete set null,
  model_version_id uuid not null references public.model_versions (id) on delete restrict,
  side text not null check (side in ('yes', 'no')),
  fair_probability numeric not null check (fair_probability >= 0 and fair_probability <= 1),
  market_probability numeric not null check (market_probability >= 0 and market_probability <= 1),
  edge numeric not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  quality_score numeric check (quality_score is null or (quality_score >= 0 and quality_score <= 1)),
  is_gold boolean not null default false,
  is_frozen boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'frozen', 'resolved', 'expired', 'invalidated')),
  time_bucket text,
  resolved_correct boolean,
  frozen_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index predictions_market_id_idx on public.predictions (market_id);
create index predictions_model_run_id_idx on public.predictions (model_run_id);
create index predictions_model_version_id_idx on public.predictions (model_version_id);
create index predictions_status_idx on public.predictions (status);
create index predictions_is_gold_idx on public.predictions (is_gold) where is_gold = true;
create index predictions_edge_idx on public.predictions (edge desc);
create index predictions_created_at_idx on public.predictions (created_at desc);
create unique index predictions_active_market_model_unique
  on public.predictions (market_id, model_version_id)
  where status = 'active';

create trigger predictions_set_updated_at
  before update on public.predictions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- prediction_factors
-- ---------------------------------------------------------------------------

create table public.prediction_factors (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions (id) on delete cascade,
  factor_name text not null,
  factor_value numeric not null,
  weight numeric not null default 0,
  contribution numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint prediction_factors_prediction_factor_unique unique (prediction_id, factor_name)
);

create index prediction_factors_prediction_id_idx on public.prediction_factors (prediction_id);

-- ---------------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------------

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  label text,
  category text,
  win_rate numeric check (win_rate is null or (win_rate >= 0 and win_rate <= 1)),
  total_pnl numeric default 0,
  trade_count integer not null default 0 check (trade_count >= 0),
  volume_traded numeric default 0,
  is_tracked boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_address_unique unique (address),
  constraint wallets_address_format check (address ~* '^0x[a-fA-F0-9]{40}$')
);

create index wallets_is_tracked_idx on public.wallets (is_tracked) where is_tracked = true;
create index wallets_win_rate_idx on public.wallets (win_rate desc nulls last);

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- wallet_positions
-- ---------------------------------------------------------------------------

create table public.wallet_positions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  side text not null check (side in ('yes', 'no')),
  size numeric not null check (size >= 0),
  avg_price numeric check (avg_price is null or (avg_price >= 0 and avg_price <= 1)),
  current_value numeric,
  pnl numeric,
  status text not null default 'open'
    check (status in ('open', 'closed', 'resolved')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wallet_positions_wallet_id_idx on public.wallet_positions (wallet_id);
create index wallet_positions_market_id_idx on public.wallet_positions (market_id);
create index wallet_positions_status_idx on public.wallet_positions (status);
create unique index wallet_positions_open_unique
  on public.wallet_positions (wallet_id, market_id, side)
  where status = 'open';

create trigger wallet_positions_set_updated_at
  before update on public.wallet_positions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- wallet_consensus
-- ---------------------------------------------------------------------------

create table public.wallet_consensus (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  side text not null check (side in ('yes', 'no')),
  wallet_count integer not null default 0 check (wallet_count >= 0),
  total_size numeric not null default 0 check (total_size >= 0),
  consensus_score numeric not null default 0
    check (consensus_score >= 0 and consensus_score <= 1),
  snapshot_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint wallet_consensus_market_side_snapshot_unique
    unique (market_id, side, snapshot_at)
);

create index wallet_consensus_market_id_idx on public.wallet_consensus (market_id);
create index wallet_consensus_snapshot_at_idx on public.wallet_consensus (snapshot_at desc);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_market_unique unique (user_id, market_id)
);

create index favorites_user_id_idx on public.favorites (user_id);
create index favorites_market_id_idx on public.favorites (market_id);

-- ---------------------------------------------------------------------------
-- user_preferences
-- ---------------------------------------------------------------------------

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  min_edge numeric default 0.05,
  min_confidence numeric default 0.5,
  categories text[] default '{}',
  notify_email boolean not null default false,
  notify_push boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_user_id_unique unique (user_id)
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null check (plan in ('free', 'core', 'gold')),
  status text not null default 'active'
    check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
create unique index subscriptions_stripe_subscription_id_unique
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_user_id_idx on public.audit_logs (user_id);
create index audit_logs_action_idx on public.audit_logs (action);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- system_health
-- ---------------------------------------------------------------------------

create table public.system_health (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  status text not null default 'unknown'
    check (status in ('healthy', 'degraded', 'unhealthy', 'unknown', 'running', 'idle')),
  last_success_at timestamptz,
  last_error text,
  last_run_at timestamptz,
  locked_until timestamptz,
  lock_owner text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_health_service_name_unique unique (service_name)
);

create index system_health_status_idx on public.system_health (status);

create trigger system_health_set_updated_at
  before update on public.system_health
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.market_snapshots enable row level security;
alter table public.model_versions enable row level security;
alter table public.model_runs enable row level security;
alter table public.predictions enable row level security;
alter table public.prediction_factors enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_positions enable row level security;
alter table public.wallet_consensus enable row level security;
alter table public.favorites enable row level security;
alter table public.user_preferences enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_health enable row level security;

-- profiles: users read/update own (cannot change role/plan via client)
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and plan = (select p.plan from public.profiles p where p.id = auth.uid())
  );

-- favorites: own only
create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());

-- user_preferences: own only
create policy "user_preferences_select_own"
  on public.user_preferences for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_preferences_update_own"
  on public.user_preferences for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- subscriptions: own read only (writes via service role / webhooks)
create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Public read: markets, snapshots, predictions, factors, wallets, positions, consensus
create policy "markets_select_public"
  on public.markets for select
  to anon, authenticated
  using (true);

create policy "market_snapshots_select_public"
  on public.market_snapshots for select
  to anon, authenticated
  using (true);

create policy "predictions_select_public"
  on public.predictions for select
  to anon, authenticated
  using (true);

create policy "prediction_factors_select_public"
  on public.prediction_factors for select
  to anon, authenticated
  using (true);

create policy "wallets_select_public"
  on public.wallets for select
  to anon, authenticated
  using (true);

create policy "wallet_positions_select_public"
  on public.wallet_positions for select
  to anon, authenticated
  using (true);

create policy "wallet_consensus_select_public"
  on public.wallet_consensus for select
  to anon, authenticated
  using (true);

-- model_versions: public read of active only (admins see all)
create policy "model_versions_select_active"
  on public.model_versions for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

-- model_runs: authenticated can read completed runs; no client writes
create policy "model_runs_select_authenticated"
  on public.model_runs for select
  to authenticated
  using (status in ('completed', 'failed') or public.is_admin());

-- system_health: public read of safe fields via view; table select limited
create policy "system_health_select_public"
  on public.system_health for select
  to anon, authenticated
  using (true);

-- audit_logs: admin read only; no user writes
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- No insert/update/delete policies for authenticated on:
-- markets, market_snapshots, predictions, prediction_factors,
-- model_runs, model_versions, wallets, wallet_positions, wallet_consensus,
-- audit_logs, system_health, subscriptions
-- Service role bypasses RLS.

-- Safe public view for system_health (excludes lock internals / raw errors detail optional)
create or replace view public.system_health_public
with (security_invoker = true)
as
select
  service_name,
  status,
  last_success_at,
  last_run_at,
  created_at,
  updated_at
from public.system_health;

grant select on public.system_health_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Job lock helper (used by cron jobs)
-- ---------------------------------------------------------------------------

create or replace function public.try_acquire_job_lock(
  p_service_name text,
  p_owner text,
  p_ttl_seconds integer default 900
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  acquired boolean := false;
begin
  insert into public.system_health (service_name, status, locked_until, lock_owner, last_run_at)
  values (p_service_name, 'running', now() + make_interval(secs => p_ttl_seconds), p_owner, now())
  on conflict (service_name) do update
    set
      status = 'running',
      locked_until = now() + make_interval(secs => p_ttl_seconds),
      lock_owner = excluded.lock_owner,
      last_run_at = now(),
      updated_at = now()
    where public.system_health.locked_until is null
       or public.system_health.locked_until < now()
       or public.system_health.lock_owner = p_owner
  returning true into acquired;

  return coalesce(acquired, false);
end;
$$;

create or replace function public.release_job_lock(
  p_service_name text,
  p_owner text,
  p_status text default 'healthy',
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.system_health
  set
    status = p_status,
    locked_until = null,
    lock_owner = null,
    last_error = p_error,
    last_success_at = case when p_status = 'healthy' then now() else last_success_at end,
    updated_at = now()
  where service_name = p_service_name
    and (lock_owner = p_owner or lock_owner is null);
end;
$$;

revoke all on function public.try_acquire_job_lock(text, text, integer) from public;
revoke all on function public.release_job_lock(text, text, text, text) from public;
grant execute on function public.try_acquire_job_lock(text, text, integer) to service_role;
grant execute on function public.release_job_lock(text, text, text, text) to service_role;
