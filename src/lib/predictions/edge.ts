import { clampProbability } from "./config";

export interface EdgeResult {
  side: "yes" | "no";
  edge: number;
  absolute_edge: number;
  fair_probability: number;
  market_probability: number;
}

export function computeEdge(
  fairProbability: number,
  marketProbability: number,
): EdgeResult {
  const fair = clampProbability(fairProbability);
  const market = clampProbability(marketProbability);
  const yesEdge = fair - market;
  const noEdge = market - fair;

  if (yesEdge >= noEdge) {
    return {
      side: "yes",
      edge: yesEdge,
      absolute_edge: Math.abs(yesEdge),
      fair_probability: fair,
      market_probability: market,
    };
  }

  return {
    side: "no",
    edge: noEdge,
    absolute_edge: Math.abs(noEdge),
    fair_probability: fair,
    market_probability: market,
  };
}
