import { clampProbability } from "./config";

export interface EdgeResult {
  side: "yes" | "no";
  edge: number;
  absolute_edge: number;
  fair_probability: number;
  market_probability: number;
  /** Probability that the selected side wins (market-implied, clamped). */
  win_probability: number;
}

/**
 * Select side with higher chance of being correct.
 * Strong market favorites (≥62% / ≤38%) lock to the favorite for win-rate focus.
 * Otherwise fall back to fair-vs-market edge.
 */
export function computeEdge(
  fairProbability: number,
  marketProbability: number,
): EdgeResult {
  const fair = clampProbability(fairProbability);
  const market = clampProbability(marketProbability);
  const yesEdge = fair - market;
  const noEdge = market - fair;

  const FAVORITE_LOCK = 0.62;
  if (market >= FAVORITE_LOCK) {
    return {
      side: "yes",
      edge: Math.max(yesEdge, market - 0.5),
      absolute_edge: Math.abs(Math.max(yesEdge, market - 0.5)),
      fair_probability: fair,
      market_probability: market,
      win_probability: market,
    };
  }
  if (market <= 1 - FAVORITE_LOCK) {
    return {
      side: "no",
      edge: Math.max(noEdge, 0.5 - market),
      absolute_edge: Math.abs(Math.max(noEdge, 0.5 - market)),
      fair_probability: fair,
      market_probability: market,
      win_probability: 1 - market,
    };
  }

  if (yesEdge >= noEdge) {
    return {
      side: "yes",
      edge: yesEdge,
      absolute_edge: Math.abs(yesEdge),
      fair_probability: fair,
      market_probability: market,
      win_probability: Math.max(fair, market),
    };
  }

  return {
    side: "no",
    edge: noEdge,
    absolute_edge: Math.abs(noEdge),
    fair_probability: fair,
    market_probability: market,
    win_probability: Math.max(1 - fair, 1 - market),
  };
}
