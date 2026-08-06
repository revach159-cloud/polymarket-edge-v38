import type { Market } from "@/types";
import { hoursUntil } from "@/lib/predictions/time-buckets";

/**
 * Daily quality gate: keep high-conviction, liquid predictions.
 * Near-close (≤5h) markets get a slightly softer bar so the 2h/5h lanes stay full.
 */
export function isQualityPrediction(market: Market, now = new Date()): boolean {
  if (!market.active || market.closed) return false;
  if (!market.selectedOutcome) return false;
  if (!market.endDate) return false;

  const hours = hoursUntil(market.endDate, now);
  if (hours == null || hours <= 0) return false;

  const marketProb = market.marketProbability;
  if (marketProb == null) return false;

  const winProb =
    market.selectedOutcome === "YES" ? marketProb : 1 - marketProb;
  const quality = market.qualityScore ?? 0;
  const liquidity = market.liquidity ?? 0;
  const volume = market.volume ?? 0;
  const nearClose = hours <= 5;
  const ultraNear = hours <= 2;

  // Avoid coin-flip noise unless ultra-near and already strongly skewed.
  if (winProb < 0.58 && !ultraNear) return false;
  if (winProb < 0.62 && ultraNear && liquidity < 400) return false;

  const minQuality = nearClose ? 42 : 50;
  const minLiquidity = nearClose ? 150 : 400;
  const minVolume = nearClose ? 0 : 200;

  if (quality < minQuality) return false;
  if (liquidity < minLiquidity) return false;
  if (volume < minVolume && !nearClose) return false;

  return true;
}

/** Soft daily target used for ranking/trim — never hard-caps below available quality. */
export const DAILY_PREDICTION_TARGET = 250;

export function selectDailyPredictions(
  markets: Market[],
  now = new Date(),
  target = DAILY_PREDICTION_TARGET,
): Market[] {
  const quality = markets.filter((m) => isQualityPrediction(m, now));
  // Prefer near-close first, then win probability / quality / smart score.
  quality.sort((a, b) => {
    const ha = hoursUntil(a.endDate, now) ?? 9999;
    const hb = hoursUntil(b.endDate, now) ?? 9999;
    const nearA = ha <= 2 ? 0 : ha <= 5 ? 1 : 2;
    const nearB = hb <= 2 ? 0 : hb <= 5 ? 1 : 2;
    if (nearA !== nearB) return nearA - nearB;

    const winA =
      a.selectedOutcome === "YES"
        ? (a.marketProbability ?? 0)
        : 1 - (a.marketProbability ?? 0);
    const winB =
      b.selectedOutcome === "YES"
        ? (b.marketProbability ?? 0)
        : 1 - (b.marketProbability ?? 0);
    if (Math.abs(winB - winA) > 0.02) return winB - winA;

    const smart = (b.smartScore ?? 0) - (a.smartScore ?? 0);
    if (smart !== 0) return smart;
    return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
  });

  // Keep at least `target` when available; never drop near-close quality rows.
  if (quality.length <= target) return quality;
  const near = quality.filter((m) => {
    const h = hoursUntil(m.endDate, now);
    return h != null && h <= 5;
  });
  if (near.length >= target) return near.slice(0, Math.max(target, near.length));
  return quality.slice(0, Math.max(target, near.length));
}
