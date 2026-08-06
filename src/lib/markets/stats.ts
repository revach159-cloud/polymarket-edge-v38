import { wilsonLowerBound } from "@/lib/analytics/stats";
import { summarizeClosedMarkets } from "@/lib/markets/closed-stats";
import { getTimeBucket } from "@/lib/predictions/time-buckets";
import type { Market } from "@/types";

export type MarketStatsSummary = {
  markets: number;
  active: number;
  within2h: number;
  within5h: number;
  within24h: number;
  scanned: number;
  closed: number;
  correct: number | null;
  /** Closed predictions with a decisive yes/no grade (matches closed table). */
  resolvedTotal: number;
  winRatePercent: number | null;
  winRateWilson: number | null;
  winRateLabel: string;
  volume: number;
  liquidity: number;
};

function formatWinRate(correct: number, total: number): {
  winRatePercent: number;
  winRateWilson: number;
  winRateLabel: string;
} {
  const pct = Math.round((correct / total) * 100);
  const wilson = Math.round(wilsonLowerBound(correct, total) * 100);
  return {
    winRatePercent: pct,
    winRateWilson: wilson,
    winRateLabel: `${pct}%`,
  };
}

/**
 * Aggregate strip stats. Win-rate / צדקנו always come from the same closed
 * market list shown below (optional recorded sides avoid post-close re-picks).
 */
export function computeMarketStats(
  activeMarkets: Market[],
  closedMarkets: Market[],
  predictedSides: ReadonlyMap<string, "YES" | "NO"> | null = null,
  now = new Date(),
): MarketStatsSummary {
  const within2h = activeMarkets.filter((m) => {
    return m.endDate && getTimeBucket(m.endDate, now) === "within_2h";
  }).length;
  const within5h = activeMarkets.filter((m) => {
    if (!m.endDate) return false;
    const bucket = getTimeBucket(m.endDate, now);
    return bucket === "within_2h" || bucket === "within_5h";
  }).length;
  const within24h = activeMarkets.filter((m) => {
    if (!m.endDate) return false;
    const bucket = getTimeBucket(m.endDate, now);
    return (
      bucket === "within_2h" ||
      bucket === "within_5h" ||
      bucket === "within_24h"
    );
  }).length;

  const closedSummary = summarizeClosedMarkets(closedMarkets, predictedSides, {
    // Live fallback keeps strip ↔ closed table identical; recorded sides win.
    fallbackToLivePick: true,
  });
  const total = closedSummary.evaluable;
  const correctCount = closedSummary.correct;

  if (total === 0) {
    return {
      markets: activeMarkets.length,
      active: activeMarkets.filter((m) => m.active && !m.closed).length,
      within2h,
      within5h,
      within24h,
      scanned: activeMarkets.length + closedMarkets.length,
      closed: closedSummary.closed,
      correct: null,
      resolvedTotal: 0,
      winRatePercent: null,
      winRateWilson: null,
      winRateLabel: "אין מדגם",
      volume: activeMarkets.reduce((s, m) => s + m.volume, 0),
      liquidity: activeMarkets.reduce((s, m) => s + m.liquidity, 0),
    };
  }

  const { winRatePercent, winRateWilson, winRateLabel } = formatWinRate(
    correctCount,
    total,
  );

  return {
    markets: activeMarkets.length,
    active: activeMarkets.filter((m) => m.active && !m.closed).length,
    within2h,
    within5h,
    within24h,
    scanned: activeMarkets.length + closedMarkets.length,
    closed: closedSummary.closed,
    correct: correctCount,
    resolvedTotal: total,
    winRatePercent,
    winRateWilson,
    winRateLabel,
    volume: activeMarkets.reduce((s, m) => s + m.volume, 0),
    liquidity: activeMarkets.reduce((s, m) => s + m.liquidity, 0),
  };
}
