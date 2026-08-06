import { inferMarketResolution, type MarketResolution } from "@/lib/markets/resolution";
import type { Market } from "@/types";

export type ClosedMarketVerdict = {
  market: Market;
  /** Model pick used for scoring — history side preferred over live re-score. */
  predictedSide: "YES" | "NO" | null;
  resolution: MarketResolution;
  /** true/false when both pick and decisive resolution exist; else null. */
  correct: boolean | null;
};

export type ClosedResolutionSummary = {
  closed: number;
  /** Closed markets with a decisive outcome + a recorded/selected pick. */
  evaluable: number;
  correct: number;
  incorrect: number;
  unresolved: number;
  verdicts: ClosedMarketVerdict[];
};

export type ClosedStatsOptions = {
  fallbackToLivePick?: boolean;
  /**
   * When true (default), only markets with a pre-close recorded pick are kept.
   * This clears נסגרו + the history board after a history reset, instead of
   * listing every Gamma closed market.
   */
  trackedOnly?: boolean;
};

/**
 * Closed markets we actually tracked while open — source of truth for נסגרו
 * and the closed-predictions board (not the raw Gamma closed dump).
 */
export function trackedClosedMarkets(
  closedMarkets: Market[],
  predictedSides?: ReadonlyMap<string, "YES" | "NO"> | null,
): Market[] {
  if (!predictedSides || predictedSides.size === 0) return [];
  return closedMarkets.filter((market) => predictedSides.has(market.id));
}

/**
 * Score one closed market the same way the closed table does.
 * Prefer a pick recorded while open; fall back to the live model pick so the
 * strip and closed table stay populated and identical on ephemeral hosts.
 */
export function evaluateClosedMarket(
  market: Market,
  predictedSide: "YES" | "NO" | null = null,
  options?: ClosedStatsOptions,
): ClosedMarketVerdict {
  const resolution = inferMarketResolution({ ...market, closed: true });
  const allowLive = options?.fallbackToLivePick !== false;
  const side = predictedSide ?? (allowLive ? market.selectedOutcome ?? null : null);
  const correct =
    side && resolution.side ? side === resolution.side : null;

  return {
    market,
    predictedSide: side,
    resolution: {
      ...resolution,
      correct,
    },
    correct,
  };
}

/** Build verdicts + aggregate counts from the same closed list shown in the UI. */
export function summarizeClosedMarkets(
  closedMarkets: Market[],
  predictedSides?: ReadonlyMap<string, "YES" | "NO"> | null,
  options?: ClosedStatsOptions,
): ClosedResolutionSummary {
  const trackedOnly = options?.trackedOnly !== false;
  const source = trackedOnly
    ? trackedClosedMarkets(closedMarkets, predictedSides)
    : closedMarkets;

  const seen = new Set<string>();
  const uniqueSource: Market[] = [];
  for (const market of source) {
    const key = market.slug?.trim()
      ? `slug:${market.slug.trim().toLowerCase()}`
      : `id:${market.id}`;
    if (seen.has(key) || seen.has(`id:${market.id}`)) continue;
    seen.add(key);
    seen.add(`id:${market.id}`);
    uniqueSource.push(market);
  }

  const verdicts = uniqueSource.map((market) =>
    evaluateClosedMarket(
      market,
      predictedSides?.get(market.id) ?? null,
      options,
    ),
  );

  let correct = 0;
  let incorrect = 0;
  let unresolved = 0;

  for (const verdict of verdicts) {
    if (verdict.correct === true) correct += 1;
    else if (verdict.correct === false) incorrect += 1;
    else unresolved += 1;
  }

  return {
    closed: uniqueSource.length,
    evaluable: correct + incorrect,
    correct,
    incorrect,
    unresolved,
    verdicts,
  };
}
