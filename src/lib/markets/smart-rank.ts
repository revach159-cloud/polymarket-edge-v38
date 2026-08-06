import type { Market } from "@/types";
import { hoursUntil } from "@/lib/predictions/time-buckets";

const SYNONYMS: Record<string, string[]> = {
  politics: ["politics", "election", "trump", "israel", "iran", "פוליטיקה", "בחירות"],
  sports: ["sports", "nba", "mlb", "nfl", "wnba", "soccer", "lol", "cs2", "ספורט"],
  crypto: ["crypto", "bitcoin", "btc", "eth", "ethereum", "solana", "קריפטו"],
  business: ["business", "fed", "gdp", "earnings", "עסקים", "כלכלה"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function synonymsFor(token: string): string[] {
  const matches = new Set<string>([token]);
  for (const [canon, alts] of Object.entries(SYNONYMS)) {
    if (token === canon || alts.includes(token)) {
      matches.add(canon);
      alts.forEach((alt) => matches.add(alt));
    }
  }
  return [...matches];
}

/** Relevance score in [0, 1] for smart search. */
export function scoreSearchRelevance(market: Market, query: string): number {
  const tokens = normalize(query)
    .split(" ")
    .filter((token) => token.length >= 2);
  if (!tokens.length) return 1;

  const haystacks = [
    { text: normalize(market.question), weight: 1 },
    { text: normalize(market.slug), weight: 0.7 },
    { text: normalize(market.category ?? ""), weight: 0.85 },
    { text: normalize(market.selectedOutcome ?? ""), weight: 0.4 },
    {
      text: normalize(market.outcomes.map((o) => o.name).join(" ")),
      weight: 0.45,
    },
  ];

  let score = 0;
  let hits = 0;
  for (const token of tokens) {
    const variants = synonymsFor(token);
    let best = 0;
    for (const variant of variants) {
      for (const hay of haystacks) {
        if (!hay.text) continue;
        if (hay.text.includes(variant)) best = Math.max(best, hay.weight);
        else if (
          variant.length >= 4 &&
          hay.text.split(" ").some((w) => w.startsWith(variant))
        ) {
          best = Math.max(best, hay.weight * 0.7);
        }
      }
    }
    if (best > 0) {
      hits += 1;
      score += best;
    }
  }

  if (!hits) return 0;
  return Math.min(1, (score / tokens.length) * (0.55 + 0.45 * (hits / tokens.length)));
}

export function computeSmartScore(market: Market, now = new Date()): number {
  const quality = (market.qualityScore ?? 0) / 100;
  const edge = Math.min(Math.abs(market.edgeScore ?? 0) * 8, 1);
  const consensusLean = Math.abs((market.walletConsensusScore ?? 0.5) - 0.5) * 2;
  const hours = hoursUntil(market.endDate, now);
  const urgency =
    hours == null || hours < 0
      ? 0.2
      : hours <= 2
        ? 1
        : hours <= 24
          ? 0.85
          : hours <= 72
            ? 0.65
            : hours <= 168
              ? 0.45
              : 0.25;
  const goldBonus = market.goldPick ? 0.08 : 0;
  const walletSupport = Math.min((market.walletSupportCount ?? 0) / 6, 1) * 0.1;

  return (
    quality * 0.34 +
    edge * 0.24 +
    consensusLean * 0.18 +
    urgency * 0.14 +
    goldBonus +
    walletSupport
  );
}

export function applySmartSearch(markets: Market[], query?: string): Market[] {
  if (!query?.trim()) return markets;
  return markets
    .map((market) => ({
      market,
      relevance: scoreSearchRelevance(market, query),
    }))
    .filter((row) => row.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .map((row) => row.market);
}
