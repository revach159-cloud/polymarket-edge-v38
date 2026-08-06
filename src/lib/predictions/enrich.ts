import { HEURISTIC_V1 } from "@/lib/predictions/config";
import { scoreMarket } from "@/lib/predictions/scoring";
import { hoursUntil } from "@/lib/predictions/time-buckets";
import { classifyFreshness } from "@/lib/predictions/freshness";
import { computeSmartScore } from "@/lib/markets/smart-rank";
import type { Market } from "@/types";

function yesPrice(market: Market): number | null {
  const yes = market.outcomes?.find((o) => o.name.toLowerCase() === "yes");
  if (yes) return yes.price;
  return market.outcomes?.[0]?.price ?? null;
}

export function enrichMarketWithHeuristic(
  market: Market,
  now = new Date(),
  options?: { walletConsensusScore?: number | null },
): Market {
  const marketProb = yesPrice(market);
  const hoursToEnd = hoursUntil(market.endDate, now);
  const freshness = classifyFreshness(market.updatedAt ?? now.toISOString(), now);
  const walletConsensusScore =
    options?.walletConsensusScore ?? market.walletConsensusScore ?? null;

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
      walletConsensusScore,
      smartScore: 0,
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
      walletConsensusScore,
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

  const walletFactor = scored.factors.find((f) => f.factor_name === "wallet_consensus");
  const winProb = scored.edge_detail.win_probability;
  const hoursLabel =
    hoursToEnd != null && hoursToEnd <= 2
      ? "נסגר בעוד שעתיים ומטה"
      : hoursToEnd != null && hoursToEnd <= 5
        ? "נסגר בעוד 5 שעות ומטה"
        : null;

  let reason: string | null = null;
  if (winProb >= 0.7) {
    reason = `מועדף חזק · סבירות שוק ≈ ${Math.round(winProb * 100)}% לצד שנבחר.`;
  } else if (
    walletConsensusScore != null &&
    Math.abs(walletConsensusScore - 0.5) >= 0.12
  ) {
    reason = `קונצנזוס ארנקים חזקים נוטה לצד שנבחר (${Math.round(walletConsensusScore * 100)}%).`;
  } else if (hoursLabel) {
    reason = `${hoursLabel} · ${supporting[0]?.explanation ?? "דירוג לפי קרבה לסגירה ואיכות."}`;
  } else {
    reason = supporting[0]?.explanation ?? null;
  }

  const enriched: Market = {
    ...market,
    marketProbability: scored.market_probability,
    modelProbability: scored.fair_probability,
    edgeScore: Math.round(scored.edge * 1000) / 1000,
    qualityScore: scored.quality_score_100,
    selectedOutcome: scored.side === "yes" ? "YES" : "NO",
    goldPick: scored.is_gold,
    primaryReason: reason,
    primaryRisk: risks[0]?.explanation ?? scored.reject_reasons[0] ?? null,
    walletConsensusScore,
  };

  return {
    ...enriched,
    smartScore: computeSmartScore(enriched, now),
    primaryRisk:
      walletFactor && walletFactor.factor_value < 0.4
        ? "ארנקים חזקים לא תומכים בצד שבחר המודל."
        : enriched.primaryRisk,
  };
}

export function enrichMarkets(
  markets: Market[],
  now = new Date(),
  consensusBySlug?: Record<string, { score: number; supportCount: number }>,
): Market[] {
  return markets.map((market) => {
    const hit = consensusBySlug?.[market.slug];
    return enrichMarketWithHeuristic(
      {
        ...market,
        walletConsensusScore: hit?.score ?? market.walletConsensusScore ?? null,
        walletSupportCount: hit?.supportCount ?? market.walletSupportCount ?? null,
      },
      now,
      { walletConsensusScore: hit?.score ?? market.walletConsensusScore ?? null },
    );
  });
}
