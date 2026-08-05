import {
  fetchGammaMarketBySlug,
  fetchGammaMarkets,
} from "@/lib/polymarket/gamma";
import { scoreMarket, type ScoringResult } from "@/lib/predictions/scoring";
import { HEURISTIC_V1 } from "@/lib/predictions/config";
import { hoursUntil } from "@/lib/predictions/time-buckets";
import {
  dedupeByEvent,
  filterDisplayMarkets,
  sortMarkets,
} from "@/lib/predictions/filter";
import type { DomainMarket } from "@/lib/polymarket/types";
import { classifyFreshness } from "@/lib/predictions/freshness";

export type ScoredMarket = DomainMarket & {
  scoring: ScoringResult;
  polymarketUrl: string;
};

export { filterDisplayMarkets, sortMarkets, fetchGammaMarkets };

function toScored(market: DomainMarket, now = new Date()): ScoredMarket {
  const marketProbability = market.yesPrice ?? 0.5;
  const scoring = scoreMarket(
    {
      marketProbability,
      yesPrice: market.yesPrice,
      noPrice: market.noPrice,
      spread: null,
      volume: market.volume ?? 0,
      liquidity: market.liquidity ?? 0,
      hoursToEnd: hoursUntil(market.closeTime, now),
      walletConsensusScore: null,
      category: market.category,
      endDate: market.closeTime,
      lastSyncedAt: market.sourceUpdatedAt,
      freshness: classifyFreshness(market.sourceUpdatedAt, now),
    },
    HEURISTIC_V1,
  );

  return {
    ...market,
    scoring,
    polymarketUrl: `https://polymarket.com/event/${encodeURIComponent(market.slug)}`,
  };
}

export async function listScoredMarkets(limit = 48): Promise<{
  markets: ScoredMarket[];
  error: string | null;
  fetchedAt: string;
  stale: boolean;
  source: "polymarket" | "empty";
}> {
  const fetchedAt = new Date().toISOString();
  try {
    const raw = await fetchGammaMarkets({
      limit,
      active: true,
      closed: false,
    });
    const now = new Date();
    const filtered = filterDisplayMarkets(
      raw
        .filter((m) => m.closeTime)
        .map((m) => ({
          id: m.polymarketMarketId,
          eventId: m.eventId,
          closeTime: m.closeTime!,
          qualityScore: null as number | null,
          liquidity: m.liquidity,
          volume: m.volume,
          closed: m.closed,
          active: m.active,
          market: m,
        })),
      now,
    );
    const sorted = sortMarkets(filtered, now);
    const deduped = dedupeByEvent(sorted);
    const markets = deduped.map((row) => toScored(row.market, now));
    markets.sort((a, b) => {
      const ba = a.scoring.time_bucket;
      const bb = b.scoring.time_bucket;
      if (ba !== bb) return String(ba).localeCompare(String(bb));
      return b.scoring.quality_score_100 - a.scoring.quality_score_100;
    });
    return {
      markets,
      error: null,
      fetchedAt,
      stale: false,
      source: markets.length ? "polymarket" : "empty",
    };
  } catch (err) {
    return {
      markets: [],
      error: err instanceof Error ? err.message : "שגיאה בטעינת שווקים",
      fetchedAt,
      stale: true,
      source: "empty",
    };
  }
}

export async function getScoredMarketBySlug(
  slug: string,
): Promise<{
  market: ScoredMarket | null;
  error: string | null;
  fetchedAt: string;
  stale: boolean;
  source: "polymarket" | "empty";
}> {
  const fetchedAt = new Date().toISOString();
  try {
    const market = await fetchGammaMarketBySlug(slug);
    if (!market) {
      return {
        market: null,
        error: "השוק לא נמצא",
        fetchedAt,
        stale: false,
        source: "empty",
      };
    }
    return {
      market: toScored(market),
      error: null,
      fetchedAt,
      stale: false,
      source: "polymarket",
    };
  } catch (err) {
    return {
      market: null,
      error: err instanceof Error ? err.message : "שגיאה בטעינת השוק",
      fetchedAt,
      stale: true,
      source: "empty",
    };
  }
}

export async function listGoldMarkets(): Promise<{
  markets: ScoredMarket[];
  error: string | null;
  fetchedAt: string;
  stale: boolean;
  source: "polymarket" | "empty";
}> {
  const result = await listScoredMarkets(80);
  const gold = result.markets.filter((m) => m.scoring.is_gold);
  return {
    ...result,
    markets: gold,
    source: gold.length ? result.source : "empty",
  };
}

export async function getMarketStats() {
  const { markets } = await listScoredMarkets(48);
  return {
    markets: markets.length,
    volume: markets.reduce((s, m) => s + (m.volume ?? 0), 0),
    liquidity: markets.reduce((s, m) => s + (m.liquidity ?? 0), 0),
  };
}
