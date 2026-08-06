import type { Market } from "@/types";

function normalizeQuestion(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Stable uniqueness key for a market card / history row.
 * Prefer Polymarket-native identifiers; never collapse different events by
 * question text alone (sports O/U lines share wording).
 */
export function marketDedupeKey(market: Pick<
  Market,
  "id" | "slug" | "conditionId" | "eventId" | "groupItemTitle" | "question" | "endDate"
>): string {
  if (market.conditionId) return `cond:${market.conditionId}`;
  const slug = market.slug?.trim();
  if (slug) return `slug:${slug.toLowerCase()}`;
  if (market.eventId && market.groupItemTitle) {
    return `event:${market.eventId}:title:${normalizeQuestion(market.groupItemTitle)}`;
  }
  if (market.eventId) {
    return `event:${market.eventId}:q:${normalizeQuestion(market.question)}`;
  }
  // Last resort: id only — do not merge by bare question.
  return `id:${market.id}`;
}

function rankMarket(market: Market): number {
  return (
    (market.qualityScore ?? 0) * 10 +
    (market.smartScore ?? 0) +
    Math.log10(Math.max(1, market.liquidity ?? 0)) +
    Math.log10(Math.max(1, market.volume ?? 0))
  );
}

/** Keep one market per dedupe key — highest rank wins. */
export function dedupeMarkets(markets: Market[]): Market[] {
  const best = new Map<string, Market>();
  for (const market of markets) {
    const key = marketDedupeKey(market);
    const prev = best.get(key);
    if (!prev || rankMarket(market) > rankMarket(prev)) {
      best.set(key, market);
    }
  }
  return [...best.values()];
}
