import type { Market } from "@/types";

export type MarketResolution = {
  label: string;
  outcomeName: string | null;
  side: "YES" | "NO" | null;
  correct: boolean | null;
};

/** Infer a resolved outcome from near-certain prices on closed markets. */
export function inferMarketResolution(market: Market): MarketResolution {
  if (!market.closed) {
    return {
      label: "פתוח",
      outcomeName: null,
      side: null,
      correct: null,
    };
  }

  const winner = market.outcomes
    .map((outcome) => ({
      ...outcome,
      price: Number(outcome.price),
    }))
    .filter((outcome) => Number.isFinite(outcome.price))
    .sort((a, b) => b.price - a.price)[0];

  if (!winner || winner.price < 0.95) {
    return {
      label: "טרם הוכרע",
      outcomeName: null,
      side: null,
      correct: null,
    };
  }

  const lower = winner.name.toLowerCase();
  const side: "YES" | "NO" | null =
    lower === "yes" ? "YES" : lower === "no" ? "NO" : null;

  const correct =
    market.selectedOutcome && side
      ? market.selectedOutcome === side
      : null;

  return {
    label: winner.name,
    outcomeName: winner.name,
    side,
    correct,
  };
}
