import { describe, expect, it } from "vitest";
import {
  evaluateClosedMarket,
  summarizeClosedMarkets,
} from "@/lib/markets/closed-stats";
import { computeMarketStats } from "@/lib/markets/stats";
import type { Market } from "@/types";

function market(partial: Partial<Market>): Market {
  return {
    id: "1",
    slug: "test",
    question: "Will it happen?",
    volume: 0,
    liquidity: 0,
    outcomes: [],
    active: false,
    closed: true,
    ...partial,
  };
}

describe("closed market verdicts", () => {
  it("can refuse live re-picks when fallback is disabled", () => {
    const verdict = evaluateClosedMarket(
      market({
        selectedOutcome: "YES",
        outcomes: [
          { id: "y", name: "Yes", price: 0.99 },
          { id: "n", name: "No", price: 0.01 },
        ],
      }),
      null,
      { fallbackToLivePick: false },
    );
    expect(verdict.correct).toBeNull();
    expect(verdict.predictedSide).toBeNull();
  });

  it("grades from the recorded side, not the live re-pick", () => {
    const closed = market({
      id: "m1",
      selectedOutcome: "YES",
      outcomes: [
        { id: "y", name: "Yes", price: 0.99 },
        { id: "n", name: "No", price: 0.01 },
      ],
    });
    const sides = new Map<string, "YES" | "NO">([["m1", "NO"]]);
    const summary = summarizeClosedMarkets([closed], sides);
    expect(summary.closed).toBe(1);
    expect(summary.evaluable).toBe(1);
    expect(summary.correct).toBe(0);
    expect(summary.incorrect).toBe(1);
  });

  it("keeps strip win-rate in sync with closed summary", () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    const closed = [
      market({
        id: "win",
        outcomes: [
          { id: "y", name: "Yes", price: 0.99 },
          { id: "n", name: "No", price: 0.01 },
        ],
      }),
      market({
        id: "lose",
        outcomes: [
          { id: "y", name: "Yes", price: 0.99 },
          { id: "n", name: "No", price: 0.01 },
        ],
      }),
      market({
        id: "open-price",
        outcomes: [
          { id: "y", name: "Yes", price: 0.55 },
          { id: "n", name: "No", price: 0.45 },
        ],
      }),
    ];
    const sides = new Map<string, "YES" | "NO">([
      ["win", "YES"],
      ["lose", "NO"],
    ]);
    const summary = summarizeClosedMarkets(closed, sides);
    const stats = computeMarketStats([], closed, sides, now);

    expect(stats.closed).toBe(summary.closed);
    expect(stats.correct).toBe(summary.correct);
    // Honest denominator = graded rows with a pre-close recorded pick.
    expect(stats.resolvedTotal).toBe(summary.evaluable);
    expect(stats.correct).toBe(1);
    expect(stats.resolvedTotal).toBe(2);
    expect(stats.winRatePercent).toBe(50);
    expect(stats.winRateLabel).toBe("50%");
  });
});
