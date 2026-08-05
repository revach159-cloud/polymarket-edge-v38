import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  v === "" || v === undefined || v === null ? undefined : v;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_APP_VERSION: z.preprocess(
    emptyToUndefined,
    z.string().default("1.0.0"),
  ),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  POLYMARKET_GAMMA_API_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://gamma-api.polymarket.com"),
  ),
  POLYMARKET_CLOB_API_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://clob.polymarket.com"),
  ),
  POLYMARKET_DATA_API_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://data-api.polymarket.com"),
  ),
  POLYMARKET_WS_URL: z.preprocess(
    emptyToUndefined,
    z.string().default("wss://ws-subscriptions-clob.polymarket.com/ws/market"),
  ),
  CRON_SECRET: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalString,
  SENTRY_AUTH_TOKEN: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_CORE_PRICE_ID: optionalString,
  STRIPE_GOLD_PRICE_ID: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  cached = parsed.data;
  return cached;
}

export function isSupabaseConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** Alias used by jobs / health. */
export function hasSupabaseConfig(): boolean {
  return isSupabaseConfigured();
}

export function isServiceRoleConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Alias used by jobs / health. */
export function hasServiceRole(): boolean {
  return isServiceRoleConfigured();
}

export function isStripeConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      env.STRIPE_SECRET_KEY &&
      env.STRIPE_WEBHOOK_SECRET &&
      env.STRIPE_CORE_PRICE_ID &&
      env.STRIPE_GOLD_PRICE_ID,
  );
}

export function isSentryConfigured(): boolean {
  return Boolean(getEnv().NEXT_PUBLIC_SENTRY_DSN);
}

export function getAppUrl(): string {
  return getEnv().NEXT_PUBLIC_APP_URL;
}

export function getAppVersion(): string {
  return getEnv().NEXT_PUBLIC_APP_VERSION;
}

export function getGammaApiUrl(): string {
  return getEnv().POLYMARKET_GAMMA_API_URL;
}

export function getClobApiUrl(): string {
  return getEnv().POLYMARKET_CLOB_API_URL;
}

export function getDataApiUrl(): string {
  return getEnv().POLYMARKET_DATA_API_URL;
}

export function getWsUrl(): string {
  return getEnv().POLYMARKET_WS_URL;
}
