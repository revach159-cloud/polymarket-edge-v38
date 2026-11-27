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
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  updatedAt?: string;
  featured?: boolean;
  events?: Array<{ id?: string; slug?: string }>;
  eventSlug?: string;
  groupItemTitle?: string;
  sportsMarketType?: string;
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

/** Prefer full timestamps; Gamma often returns date-only endDateIso (midnight). */
export function pickCloseTime(endDate?: string | null, endDateIso?: string | null): string | null {
  const candidates = [endDate, endDateIso].filter(Boolean) as string[];
  if (!candidates.length) return null;
  const withTime = candidates.find((c) => /T\d{2}:\d{2}/.test(c));
  return withTime ?? candidates[0] ?? null;
}

export function mapGammaMarket(raw: GammaMarket): Market {
  const names = parseJsonArray(raw.outcomes);
  const prices = parseJsonArray(raw.outcomePrices).map((p) => toNumber(p));
  const tokenIds = parseJsonArray(raw.clobTokenIds);
  const outcomes: MarketOutcome[] = (names.length ? names : ["Yes", "No"]).map((name, i) => ({
    id: tokenIds[i] ?? `${raw.id ?? "m"}-${i}`,
    name,
    price: prices[i] ?? 0,
    tokenId: tokenIds[i],
  }));

  const question = raw.question ?? "שוק ללא כותרת";
  const slug = raw.slug || slugify(question) || raw.id || "market";
  const eventSlug = raw.eventSlug || raw.events?.[0]?.slug || null;
  const eventId = raw.events?.[0]?.id ?? null;

  return {
    id: String(raw.id ?? raw.conditionId ?? slug),
    slug,
    eventSlug,
    eventId,
    question,
    description: raw.description,
    category: raw.category,
    groupItemTitle: raw.groupItemTitle?.trim() || null,
    sportsMarketType: raw.sportsMarketType?.trim() || null,
    imageUrl: raw.image || raw.icon,
    endDate: pickCloseTime(raw.endDate, raw.endDateIso),
    volume: raw.volumeNum ?? toNumber(raw.volume),
    liquidity: raw.liquidityNum ?? toNumber(raw.liquidity),
    outcomes,
    active: raw.active !== false && !raw.closed,
    closed: Boolean(raw.closed),
    featured: Boolean(raw.featured),
    updatedAt: raw.updatedAt,
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
        "User-Agent": "polymarket-edge-lab/1.0",
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
  endDateMin?: string;
  endDateMax?: string;
}): Promise<{ markets: Market[]; error?: string }> {
  const gamma = getGammaApiUrl();
  const sp = new URLSearchParams();
  sp.set("limit", String(params?.limit ?? 40));
  sp.set("offset", String(params?.offset ?? 0));
  if (params?.active !== undefined) sp.set("active", String(params.active));
  if (params?.closed !== undefined) sp.set("closed", String(params.closed));
  if (params?.endDateMin) sp.set("end_date_min", params.endDateMin);
  if (params?.endDateMax) sp.set("end_date_max", params.endDateMax);
  sp.set("order", params?.order ?? "volume24hr");
  sp.set("ascending", String(params?.ascending ?? false));

  const { data, error } = await fetchJson<GammaMarket[]>(`${gamma}/markets?${sp.toString()}`);

  if (!data) return { markets: [], error: error ?? "לא התקבלו נתונים" };
  return { markets: data.map(mapGammaMarket) };
}

/** Paginate Gamma markets and merge/dedupe by id. */
export async function fetchGammaMarketsPaged(
  params: {
    active?: boolean;
    closed?: boolean;
    order?: string;
    ascending?: boolean;
    endDateMin?: string;
    endDateMax?: string;
    pageSize?: number;
    maxPages?: number;
  } = {},
): Promise<{ markets: Market[]; error?: string }> {
  const pageSize = params.pageSize ?? 100;
  const maxPages = params.maxPages ?? 5;
  const byId = new Map<string, Market>();
  let lastError: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const { markets, error } = await fetchGammaMarkets({
      limit: pageSize,
      offset: page * pageSize,
      active: params.active,
      closed: params.closed,
      order: params.order,
      ascending: params.ascending,
      endDateMin: params.endDateMin,
      endDateMax: params.endDateMax,
    });
    if (error) lastError = error;
    if (!markets.length) break;
    for (const market of markets) byId.set(market.id, market);
    if (markets.length < pageSize) break;
  }

  return {
    markets: [...byId.values()],
    error: byId.size ? undefined : lastError,
  };
}

/**
 * Multi-lane pull: near-close windows (2h / 5h / 24h) + volume for quality depth.
 * Targets 250+ active candidates with emphasis on markets closing soon.
 */
const universeCache: { at: number; value: { markets: Market[]; error?: string } | null } = {
  at: 0,
  value: null,
};

export async function fetchActivePredictionUniverse(now = new Date()): Promise<{
  markets: Market[];
  error?: string;
}> {
  const cached = universeCache.value;
  if (cached && Date.now() - universeCache.at < 45_000) {
    return cached;
  }

  const iso = (msFromNow: number) => new Date(now.getTime() + msFromNow).toISOString();
  const hour = 3_600_000;
  const day = 24 * hour;

  const lanes = await Promise.all([
    // Closing within 2 hours — highest priority lane
    fetchGammaMarketsPaged({
      active: true,
      closed: false,
      order: "endDate",
      ascending: true,
      endDateMin: iso(0),
      endDateMax: iso(2 * hour),
      pageSize: 100,
      maxPages: 5,
    }),
    // Closing within 5 hours
    fetchGammaMarketsPaged({
      active: true,
      closed: false,
      order: "endDate",
      ascending: true,
      endDateMin: iso(0),
      endDateMax: iso(5 * hour),
      pageSize: 100,
      maxPages: 6,
    }),
    // Closing within 24 hours
    fetchGammaMarketsPaged({
      active: true,
      closed: false,
      order: "endDate",
      ascending: true,
      endDateMin: iso(0),
      endDateMax: iso(day),
      pageSize: 100,
      maxPages: 6,
    }),
    // Volume-ranked within 30 days for quality depth toward 250+
    fetchGammaMarketsPaged({
      active: true,
      closed: false,
      order: "volume24hr",
      ascending: false,
      endDateMin: iso(0),
      endDateMax: iso(30 * day),
      pageSize: 100,
      maxPages: 8,
    }),
    // Liquidity-ranked near-term backup
    fetchGammaMarketsPaged({
      active: true,
      closed: false,
      order: "liquidityNum",
      ascending: false,
      endDateMin: iso(0),
      endDateMax: iso(7 * day),
      pageSize: 100,
      maxPages: 3,
    }),
  ]);

  const byId = new Map<string, Market>();
  for (const lane of lanes) {
    for (const market of lane.markets) byId.set(market.id, market);
  }
  const error = lanes.map((l) => l.error).find(Boolean);

  const result = {
    markets: [...byId.values()],
    error: byId.size ? undefined : error,
  };
  universeCache.at = Date.now();
  universeCache.value = result;
  return result;
}

async function fetchGammaMarketByPathId(
  id: string,
): Promise<{ market: Market | null; error?: string }> {
  if (!id.trim()) return { market: null, error: "חסר מזהה שוק" };
  const gamma = getGammaApiUrl();
  const byId = await fetchJson<GammaMarket>(`${gamma}/markets/${encodeURIComponent(id)}`);
  if (byId.data && (byId.data.question || byId.data.id)) {
    return { market: mapGammaMarket(byId.data) };
  }
  return { market: null, error: byId.error ?? "השוק לא נמצא" };
}

/**
 * Resolve a market for history sync. Prefer slug query, then path id.
 * Closed short-horizon markets often drop out of `?slug=` but remain
 * available at `/markets/{id}` — without the id fallback the open queue
 * gets stuck forever on the same oldest ghosts.
 */
export async function fetchGammaMarketBySlug(
  slug: string,
  marketId?: string | null,
): Promise<{ market: Market | null; error?: string }> {
  const gamma = getGammaApiUrl();
  const slugKey = slug?.trim() ?? "";
  const idKey = marketId?.trim() ?? "";

  if (slugKey) {
    const { data, error } = await fetchJson<GammaMarket[]>(
      `${gamma}/markets?slug=${encodeURIComponent(slugKey)}`,
    );
    if (data && data.length > 0) {
      return { market: mapGammaMarket(data[0]) };
    }
    // Slug string as path only helps when the caller passed an id-like value.
    const bySlugPath = await fetchGammaMarketByPathId(slugKey);
    if (bySlugPath.market) return bySlugPath;
    if (!idKey || idKey === slugKey) {
      return {
        market: null,
        error: error ?? bySlugPath.error ?? "השוק לא נמצא",
      };
    }
  }

  if (idKey) {
    return fetchGammaMarketByPathId(idKey);
  }

  return { market: null, error: "השוק לא נמצא" };
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

export type LeaderboardTimePeriod = "DAY" | "WEEK" | "MONTH" | "ALL";

type LeaderboardRow = {
  proxyWallet?: string;
  address?: string;
  pnl?: number;
  vol?: number;
  volume?: number;
  realizedPnl?: number;
  userName?: string;
  rank?: string | number;
};

export async function fetchPnlLeaderboard(
  limit = 20,
  timePeriod: LeaderboardTimePeriod = "MONTH",
): Promise<{ wallets: WalletSummary[]; error?: string }> {
  const dataApi = getDataApiUrl();
  const { data, error } = await fetchJson<LeaderboardRow[]>(
    `${dataApi}/v1/leaderboard?limit=${limit}&timePeriod=${timePeriod}&orderBy=PNL`,
  );

  if (!data || !Array.isArray(data)) {
    return { wallets: [], error: error ?? "לוח מובילים אינו זמין כרגע" };
  }

  const wallets: WalletSummary[] = data.slice(0, limit).map((row, i) => ({
    address: (row.proxyWallet || row.address || `unknown-${i}`).toLowerCase(),
    pnl: row.realizedPnl ?? row.pnl,
    volume: row.volume ?? row.vol,
    rank: toNumber(row.rank, i + 1),
    userName: row.userName ?? null,
  }));

  return { wallets };
}

export async function fetchTopWallets(
  limit = 20,
): Promise<{ wallets: WalletSummary[]; error?: string }> {
  return fetchPnlLeaderboard(limit, "MONTH");
}

export async function fetchClosedPositionPnls(
  address: string,
  limit = 50,
): Promise<{ pnls: number[]; error?: string }> {
  const dataApi = getDataApiUrl();
  const { data, error } = await fetchJson<Array<{ realizedPnl?: number | string }>>(
    `${dataApi}/closed-positions?user=${encodeURIComponent(address)}&limit=${limit}&sortBy=TIMESTAMP&sortDirection=DESC`,
  );
  if (!data || !Array.isArray(data)) {
    return { pnls: [], error: error ?? "פוזיציות סגורות אינן זמינות" };
  }
  return {
    pnls: data.map((row) => toNumber(row.realizedPnl)).filter((n) => Number.isFinite(n)),
  };
}

export async function fetchOpenUnrealizedLoss(
  address: string,
  limit = 50,
): Promise<{ openUnrealizedLoss: number; error?: string }> {
  const dataApi = getDataApiUrl();
  const { data, error } = await fetchJson<Array<{ cashPnl?: number | string }>>(
    `${dataApi}/positions?user=${encodeURIComponent(address)}&limit=${limit}`,
  );
  if (!data || !Array.isArray(data)) {
    return { openUnrealizedLoss: 0, error: error ?? "פוזיציות פתוחות אינן זמינות" };
  }
  const openUnrealizedLoss = data.reduce((sum, row) => {
    const pnl = toNumber(row.cashPnl);
    return pnl < 0 ? sum + Math.abs(pnl) : sum;
  }, 0);
  return { openUnrealizedLoss };
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
  >(`${dataApi}/activity?user=${encodeURIComponent(address)}&limit=${limit}`);

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
