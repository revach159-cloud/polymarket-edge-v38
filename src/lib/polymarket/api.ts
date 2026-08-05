import { getClobApiUrl, getDataApiUrl, getGammaApiUrl } from "@/lib/env";
import { slugify } from "@/lib/utils";
import type { Market, MarketOutcome, WalletSummary, WalletTrade } from "@/types";

type GammaMarket = {
  id?: string;
  conditionId?: string;
  question?: string;
  description?: string;
  slug?: string;
  category?: string;
  image?: string;
  icon?: string;
  endDate?: string;
  endDateIso?: string;
  volume?: string | number;
  volumeNum?: number;
  liquidity?: string | number;
  liquidityNum?: number;
  active?: boolean;
  closed?: boolean;
  resolved?: boolean;
  umaResolutionStatus?: string;
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  updatedAt?: string;
  featured?: boolean;
  closedTime?: string;
};

function parseJsonArray(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toNumber(value: string | number | undefined, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function mapGammaMarket(raw: GammaMarket): Market {
  const names = parseJsonArray(raw.outcomes);
  const prices = parseJsonArray(raw.outcomePrices).map((p) => toNumber(p));
  const tokenIds = parseJsonArray(raw.clobTokenIds);
  const outcomes: MarketOutcome[] = (names.length ? names : ["Yes", "No"]).map(
    (name, i) => ({
      id: tokenIds[i] ?? `${raw.id ?? "m"}-${i}`,
      name,
      price: prices[i] ?? 0,
      tokenId: tokenIds[i],
    }),
  );

  const question = raw.question ?? "שוק ללא כותרת";
  const slug = raw.slug || slugify(question) || raw.id || "market";

  const resolved =
    Boolean(raw.resolved) ||
    String(raw.umaResolutionStatus ?? "").toLowerCase() === "resolved";

  return {
    id: String(raw.id ?? raw.conditionId ?? slug),
    slug,
    question,
    description: raw.description,
    category: raw.category,
    imageUrl: raw.image || raw.icon,
    endDate: raw.endDateIso ?? raw.endDate ?? null,
    volume: raw.volumeNum ?? toNumber(raw.volume),
    liquidity: raw.liquidityNum ?? toNumber(raw.liquidity),
    outcomes,
    active: raw.active !== false && !raw.closed && !resolved,
    closed: Boolean(raw.closed) || resolved,
    resolved,
    resolutionStatus: raw.umaResolutionStatus ?? (resolved ? "resolved" : null),
    featured: Boolean(raw.featured),
    updatedAt: raw.updatedAt ?? raw.closedTime,
    conditionId: raw.conditionId,
    clobTokenIds: tokenIds,
  };
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ data: T | null; error?: string }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { data };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "שגיאת רשת",
    };
  }
}

export async function fetchGammaMarkets(params?: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
}): Promise<{ markets: Market[]; error?: string }> {
  const gamma = getGammaApiUrl();
  const sp = new URLSearchParams();
  sp.set("limit", String(params?.limit ?? 40));
  sp.set("offset", String(params?.offset ?? 0));
  if (params?.active !== undefined) sp.set("active", String(params.active));
  if (params?.closed !== undefined) sp.set("closed", String(params.closed));
  sp.set("order", params?.order ?? "volume24hr");
  sp.set("ascending", String(params?.ascending ?? false));

  const { data, error } = await fetchJson<GammaMarket[]>(
    `${gamma}/markets?${sp.toString()}`,
  );

  if (!data) return { markets: [], error: error ?? "לא התקבלו נתונים" };
  return { markets: data.map(mapGammaMarket) };
}

export async function fetchGammaMarketBySlug(
  slug: string,
): Promise<{ market: Market | null; error?: string }> {
  const gamma = getGammaApiUrl();
  const { data, error } = await fetchJson<GammaMarket[]>(
    `${gamma}/markets?slug=${encodeURIComponent(slug)}`,
  );
  if (error) return { market: null, error };
  if (data && data.length > 0) {
    return { market: mapGammaMarket(data[0]) };
  }

  // Fallback: search by id-like slug
  const byId = await fetchJson<GammaMarket>(`${gamma}/markets/${encodeURIComponent(slug)}`);
  if (byId.data && (byId.data.question || byId.data.id)) {
    return { market: mapGammaMarket(byId.data) };
  }

  return { market: null, error: byId.error ?? "השוק לא נמצא" };
}

export async function fetchClobPrices(
  tokenIds: string[],
): Promise<{ prices: Record<string, number>; error?: string }> {
  if (!tokenIds.length) return { prices: {} };
  const clob = getClobApiUrl();
  const prices: Record<string, number> = {};
  let lastError: string | undefined;

  await Promise.all(
    tokenIds.slice(0, 8).map(async (tokenId) => {
      const { data, error } = await fetchJson<{ price?: string; mid?: string }>(
        `${clob}/price?token_id=${encodeURIComponent(tokenId)}&side=buy`,
      );
      if (error) {
        lastError = error;
        return;
      }
      const p = toNumber(data?.price ?? data?.mid);
      if (p > 0) prices[tokenId] = p;
    }),
  );

  return { prices, error: Object.keys(prices).length ? undefined : lastError };
}

export async function fetchPriceHistory(
  tokenId: string,
  interval = "1d",
  fidelity = 60,
): Promise<{ points: { t: number; p: number }[]; error?: string }> {
  const clob = getClobApiUrl();
  const { data, error } = await fetchJson<{ history?: { t: number; p: number }[] }>(
    `${clob}/prices-history?market=${encodeURIComponent(tokenId)}&interval=${interval}&fidelity=${fidelity}`,
  );
  if (!data?.history) return { points: [], error: error ?? "אין היסטוריית מחירים" };
  return { points: data.history };
}

export async function fetchTopWallets(
  limit = 20,
): Promise<{ wallets: WalletSummary[]; error?: string }> {
  const dataApi = getDataApiUrl();
  // Public leaderboard-ish endpoint; may vary — handle gracefully
  const { data, error } = await fetchJson<
    Array<{
      proxyWallet?: string;
      address?: string;
      pnl?: number;
      vol?: number;
      volume?: number;
      realizedPnl?: number;
    }>
  >(`${dataApi}/v1/leaderboard?limit=${limit}&window=all`);

  if (!data || !Array.isArray(data)) {
    return { wallets: [], error: error ?? "לוח מובילים אינו זמין כרגע" };
  }

  const wallets: WalletSummary[] = data.slice(0, limit).map((row, i) => ({
    address: row.proxyWallet || row.address || `unknown-${i}`,
    pnl: row.realizedPnl ?? row.pnl,
    volume: row.volume ?? row.vol,
    rank: i + 1,
    userName: (row as { userName?: string }).userName ?? null,
  }));

  return { wallets };
}

export async function fetchWalletActivity(
  address: string,
  limit = 30,
): Promise<{ trades: WalletTrade[]; error?: string }> {
  const dataApi = getDataApiUrl();
  const { data, error } = await fetchJson<
    Array<{
      id?: string;
      transactionHash?: string;
      side?: string;
      price?: number;
      size?: number;
      timestamp?: string | number;
      title?: string;
      slug?: string;
      outcome?: string;
    }>
  >(
    `${dataApi}/activity?user=${encodeURIComponent(address)}&limit=${limit}`,
  );

  if (!data || !Array.isArray(data)) {
    return { trades: [], error: error ?? "פעילות הארנק אינה זמינה" };
  }

  const trades: WalletTrade[] = data.map((row, i) => ({
    id: row.id || row.transactionHash || `t-${i}`,
    marketSlug: row.slug,
    marketQuestion: row.title,
    side: (row.side?.toUpperCase() === "SELL" ? "SELL" : "BUY") as "BUY" | "SELL",
    outcome: row.outcome,
    price: toNumber(row.price),
    size: toNumber(row.size),
    timestamp:
      typeof row.timestamp === "number"
        ? new Date(row.timestamp * (row.timestamp < 1e12 ? 1000 : 1)).toISOString()
        : String(row.timestamp ?? new Date().toISOString()),
  }));

  return { trades };
}

export async function probeGamma(): Promise<"ok" | "degraded" | "down"> {
  const gamma = getGammaApiUrl();
  try {
    const res = await fetch(`${gamma}/markets?limit=1`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return "ok";
    if (res.status >= 500) return "down";
    return "degraded";
  } catch {
    return "down";
  }
}

export async function probeClob(): Promise<"ok" | "degraded" | "down"> {
  const clob = getClobApiUrl();
  try {
    const res = await fetch(`${clob}/time`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return "ok";
    if (res.status >= 500) return "down";
    return "degraded";
  } catch {
    return "down";
  }
}
