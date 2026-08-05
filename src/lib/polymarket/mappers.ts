import type { GammaMarketRaw } from "./schemas";
import type { DomainBook, DomainMarket, MarketStatus } from "./types";

function parseMaybeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapGammaMarket(raw: GammaMarketRaw): DomainMarket {
  const tokens = parseMaybeJsonArray(raw.clobTokenIds);
  const prices = parseMaybeJsonArray(raw.outcomePrices).map((p) => toNumber(p));
  const eventId = raw.events?.[0]?.id ?? null;
  const slug =
    raw.slug ||
    raw.events?.[0]?.slug ||
    `market-${raw.id}`;
  const question = raw.question || raw.title || "Untitled market";
  const closeTime = raw.endDate || raw.end_date_iso || null;
  const closed = Boolean(raw.closed);
  const resolved = Boolean(raw.resolved);
  const active = raw.active !== false && !closed && !resolved;

  let status: MarketStatus = "active";
  if (resolved) status = "resolved";
  else if (closed) status = "awaiting_resolution";
  else if (!active) status = "unresolved";

  return {
    polymarketMarketId: String(raw.id),
    eventId,
    conditionId: raw.conditionId || raw.condition_id || null,
    question,
    description: raw.description ?? null,
    slug,
    category: raw.category || raw.tags?.[0]?.label || null,
    resolutionSource: raw.resolutionSource ?? null,
    closeTime,
    active,
    closed,
    resolved,
    status,
    yesTokenId: tokens[0] ?? null,
    noTokenId: tokens[1] ?? null,
    yesPrice: prices[0] ?? null,
    noPrice: prices[1] ?? null,
    volume: toNumber(raw.volume),
    liquidity: toNumber(raw.liquidity),
    sourceUpdatedAt: new Date().toISOString(),
  };
}

export function mapOrderBook(book: {
  bids?: Array<{ price: string | number; size: string | number }>;
  asks?: Array<{ price: string | number; size: string | number }>;
}): DomainBook {
  const bestBid = book.bids?.[0] ? toNumber(book.bids[0].price) : null;
  const bestAsk = book.asks?.[0] ? toNumber(book.asks[0].price) : null;
  const spread =
    bestBid !== null && bestAsk !== null ? Math.max(0, bestAsk - bestBid) : null;
  const midpoint =
    bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;
  const depthBids = (book.bids ?? [])
    .slice(0, 5)
    .reduce((s, l) => s + (toNumber(l.size) ?? 0), 0);
  const depthAsks = (book.asks ?? [])
    .slice(0, 5)
    .reduce((s, l) => s + (toNumber(l.size) ?? 0), 0);
  return {
    bestBid,
    bestAsk,
    spread,
    midpoint,
    depth: depthBids + depthAsks,
  };
}
