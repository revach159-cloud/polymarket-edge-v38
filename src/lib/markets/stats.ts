import { getTimeBucket } from "@/lib/predictions/time-buckets";
import type { Market } from "@/types";

export type MarketStatsSummary = {
  markets: number;
  active: number;
  within2h: number;
  within24h: number;
  scanned: number;
  closed: number;
  correct: number | null;
  winRateLabel: string;
  volume: number;
  liquidity: number;
};

export function computeMarketStats(
  activeMarkets: Market[],
  closedMarkets: Market[],
  resolvedPredictions: Array<{ correct: boolean }> = [],
  now = new Date(),
): MarketStatsSummary {
  const within2h = activeMarkets.filter((m) => {
    return m.endDate && getTimeBucket(m.endDate, now) === "within_2h";
  }).length;
  const within24h = activeMarkets.filter((m) => {
    if (!m.endDate) return false;
    const bucket = getTimeBucket(m.endDate, now);
    return bucket === "within_2h" || bucket === "within_6h" || bucket === "within_24h";
  }).length;
  const correct = resolvedPredictions.length
    ? resolvedPredictions.filter((prediction) => prediction.correct).length
    : null;
  const winRateLabel =
    correct == null
      ? "— · אין מדגם מוכרע עדיין"
      : `${Math.round((correct / resolvedPredictions.length) * 100)}% · n=${resolvedPredictions.length}`;

  return {
    markets: activeMarkets.length,
    active: activeMarkets.filter((m) => m.active && !m.closed).length,
    within2h,
    within24h,
    scanned: activeMarkets.length + closedMarkets.length,
    closed: closedMarkets.length,
    correct,
    winRateLabel,
    volume: activeMarkets.reduce((s, m) => s + m.volume, 0),
    liquidity: activeMarkets.reduce((s, m) => s + m.liquidity, 0),
  };
}
