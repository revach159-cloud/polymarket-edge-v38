import {
  formatPredictionLabel,
  isGenericYesNoLabel,
  normalizeOutcomeSide,
} from "@/lib/markets/outcome-label";
import type { Market } from "@/types";

export type MarketResolution = {
  label: string;
  outcomeName: string | null;
  side: "YES" | "NO" | null;
  correct: boolean | null;
};

/**
 * Map a decisive winning outcome to YES/NO.
 * Heuristic scoring treats outcomes[0] as YES (see yesPrice in enrich.ts),
 * so binary team/spread markets must resolve by index when names aren't Yes/No.
 */
export function sideFromWinningOutcome(
  market: Pick<Market, "outcomes">,
  winnerName: string,
  winnerIndex?: number,
): "YES" | "NO" | null {
  const fromName = normalizeOutcomeSide(winnerName);
  if (fromName) return fromName;

  const outcomes = market.outcomes ?? [];
  if (outcomes.length !== 2) return null;

  const idx =
    winnerIndex ??
    outcomes.findIndex(
      (o) => o.name.trim().toLowerCase() === winnerName.trim().toLowerCase(),
    );
  if (idx === 0) return "YES";
  if (idx === 1) return "NO";
  return null;
}

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

  const priced = market.outcomes
    .map((outcome, index) => ({
      ...outcome,
      index,
      price: Number(outcome.price),
    }))
    .filter((outcome) => Number.isFinite(outcome.price))
    .sort((a, b) => b.price - a.price);

  const winner = priced[0];

  if (!winner || winner.price < 0.95) {
    return {
      label: "טרם הוכרע",
      outcomeName: null,
      side: null,
      correct: null,
    };
  }

  const side = sideFromWinningOutcome(market, winner.name, winner.index);

  const correct =
    market.selectedOutcome && side
      ? market.selectedOutcome === side
      : null;

  const concreteName =
    market.groupItemTitle && side === "YES"
      ? market.groupItemTitle
      : !isGenericYesNoLabel(winner.name)
        ? winner.name
        : null;

  return {
    label:
      concreteName ??
      formatPredictionLabel({ ...market, selectedOutcome: side }, side),
    outcomeName: concreteName ?? winner.name,
    side,
    correct,
  };
}
