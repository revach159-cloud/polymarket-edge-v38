import { isSportsMoneylineMarket } from "@/lib/markets/outcome-label";
import type { Market } from "@/types";
import { hoursUntil } from "@/lib/predictions/time-buckets";

/**
 * Markets at ≥98% on one side have almost no payout if you are right.
 * Keep selection inside a tradable conviction band.
 */
export const MIN_TRADEABLE_WIN = 0.58;
export const MAX_TRADEABLE_WIN = 0.97;

export function selectedWinProbability(market: Market): number | null {
  if (market.marketProbability == null || !market.selectedOutcome) return null;
  return market.selectedOutcome === "YES"
    ? market.marketProbability
    : 1 - market.marketProbability;
}

/** True when either Yes or No is already 98%+ — no real edge to harvest. */
export function isOneSidedLock(market: Market): boolean {
  const p = market.marketProbability;
  if (p == null) return true;
  const favorite = Math.max(p, 1 - p);
  return favorite >= MAX_TRADEABLE_WIN;
}

/**
 * Daily quality gate: high-conviction, liquid, and still tradable.
 * Near-close (≤5h) markets get a slightly softer bar so 2h/5h lanes stay full.
 */
export function isQualityPrediction(market: Market, now = new Date()): boolean {
  if (!market.active || market.closed) return false;
  if (!market.selectedOutcome) return false;
  if (!market.endDate) return false;

  // Sports moneyline is "Team / Draw" — only YES backs a real named outcome.
  // A NO pick would render as Yes/No noise; the sibling market carries the edge.
  if (
    isSportsMoneylineMarket(market) &&
    market.selectedOutcome === "NO"
  ) {
    return false;
  }

  const hours = hoursUntil(market.endDate, now);
  if (hours == null || hours <= 0) return false;

  if (isOneSidedLock(market)) return false;

  const winProb = selectedWinProbability(market);
  if (winProb == null) return false;
  if (winProb < MIN_TRADEABLE_WIN) return false;
  if (winProb >= MAX_TRADEABLE_WIN) return false;

  const quality = market.qualityScore ?? 0;
  const liquidity = market.liquidity ?? 0;
  const volume = market.volume ?? 0;
  const nearClose = hours <= 5;
  const ultraNear = hours <= 2;

  // Avoid coin-flip noise unless ultra-near and already skewed + liquid.
  if (winProb < 0.62 && ultraNear && liquidity < 400) return false;
  if (winProb < 0.62 && !ultraNear) return false;

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
  // Near-close first, then tradable conviction (not 98%+ locks), then scores.
  quality.sort((a, b) => {
    const ha = hoursUntil(a.endDate, now) ?? 9999;
    const hb = hoursUntil(b.endDate, now) ?? 9999;
    const nearA = ha <= 2 ? 0 : ha <= 5 ? 1 : 2;
    const nearB = hb <= 2 ? 0 : hb <= 5 ? 1 : 2;
    if (nearA !== nearB) return nearA - nearB;

    const winA = selectedWinProbability(a) ?? 0;
    const winB = selectedWinProbability(b) ?? 0;
    // Prefer solid favorites inside the tradable band, not maxed-out locks.
    if (Math.abs(winB - winA) > 0.02) return winB - winA;

    const edge = Math.abs(b.edgeScore ?? 0) - Math.abs(a.edgeScore ?? 0);
    if (Math.abs(edge) > 0.005) return edge;

    const smart = (b.smartScore ?? 0) - (a.smartScore ?? 0);
    if (smart !== 0) return smart;
    return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
  });

  if (quality.length <= target) return quality;
  const near = quality.filter((m) => {
    const h = hoursUntil(m.endDate, now);
    return h != null && h <= 5;
  });
  if (near.length >= target) return near.slice(0, Math.max(target, near.length));
  return quality.slice(0, Math.max(target, near.length));
}
