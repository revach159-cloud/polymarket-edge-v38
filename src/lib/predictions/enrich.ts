import { HEURISTIC_V1 } from "@/lib/predictions/config";
import { scoreMarket } from "@/lib/predictions/scoring";
import { hoursUntil } from "@/lib/predictions/time-buckets";
import { classifyFreshness } from "@/lib/predictions/freshness";
import type { Market } from "@/types";

function yesPrice(market: Market): number | null {
  const yes = market.outcomes?.find((o) => o.name.toLowerCase() === "yes");
  if (yes) return yes.price;
  return market.outcomes?.[0]?.price ?? null;
}

export function enrichMarketWithHeuristic(market: Market, now = new Date()): Market {
  const marketProb = yesPrice(market);
  const hoursToEnd = hoursUntil(market.endDate, now);
  const freshness = classifyFreshness(market.updatedAt ?? now.toISOString(), now);

  const hasCriticalGaps =
    !market.question ||
    !market.endDate ||
    marketProb === null ||
    !(market.clobTokenIds?.length);

  const resolutionUnclear =
    !market.description || (market.description?.length ?? 0) < 40;

  if (marketProb == null) {
    return {
      ...market,
      marketProbability: null,
      modelProbability: null,
      edgeScore: null,
      qualityScore: null,
      selectedOutcome: null,
      goldPick: false,
      primaryReason: null,
      primaryRisk: "חסר מחיר שוק",
    };
  }

  const scored = scoreMarket(
    {
      marketProbability: marketProb,
      yesPrice: marketProb,
      noPrice: 1 - marketProb,
      spread: market.spread ?? null,
      volume: market.volume ?? 0,
      liquidity: market.liquidity ?? 0,
      hoursToEnd,
      walletConsensusScore: null,
      category: market.category ?? null,
      endDate: market.endDate ?? null,
      lastSyncedAt: market.updatedAt ?? null,
      now,
      freshness,
      hasConflict: false,
      resolutionUnclear: resolutionUnclear || hasCriticalGaps,
    },
    HEURISTIC_V1,
  );

  const supporting = scored.factors
    .filter((f) => f.factor_value >= 0.6)
    .sort((a, b) => b.contribution - a.contribution);
  const risks = scored.factors
    .filter((f) => f.factor_value < 0.45)
    .sort((a, b) => a.factor_value - b.factor_value);

  return {
    ...market,
    marketProbability: scored.market_probability,
    modelProbability: scored.fair_probability,
    edgeScore: Math.round(scored.edge * 1000) / 1000,
    qualityScore: scored.quality_score_100,
    selectedOutcome: scored.side === "yes" ? "YES" : "NO",
    goldPick: scored.is_gold,
    primaryReason: supporting[0]?.explanation ?? null,
    primaryRisk: risks[0]?.explanation ?? scored.reject_reasons[0] ?? null,
  };
}

export function enrichMarkets(markets: Market[], now = new Date()): Market[] {
  return markets.map((m) => enrichMarketWithHeuristic(m, now));
}
