import { describe, expect, it } from "vitest";
import { summarizeFromHistory } from "@/lib/history/closed-board";
import type { HistoryPrediction } from "@/lib/history/prediction-store";
import { computeMarketStats } from "@/lib/markets/stats";
import type { Market } from "@/types";

function hist(partial: Partial<HistoryPrediction>): HistoryPrediction {
  const marketId = partial.marketId ?? "m1";
  return {
    id: partial.id ?? `pred:${marketId}`,
    marketId,
    slug: partial.slug ?? `slug-${marketId}`,
    marketQuestion: "Will it happen?",
    side: "YES",
    marketProbability: 0.4,
    modelProbability: 0.55,
    edgeScore: 0.15,
    qualityScore: 70,
    walletConsensusScore: null,
    recordedAt: "2026-08-01T00:00:00.000Z",
    status: "resolved",
    resolvedAt: "2026-08-02T00:00:00.000Z",
    resolvedOutcome: "Yes",
    correct: true,
    source: "live-sync",
    ...partial,
  };
}

function market(partial: Partial<Market>): Market {
  return {
    id: "m1",
    slug: partial.id ? `slug-${partial.id}` : "m1",
    question: "Will it happen?",
    volume: 0,
    liquidity: 0,
    outcomes: [
      { id: "y", name: "Yes", price: 0.99 },
      { id: "n", name: "No", price: 0.01 },
    ],
    active: false,
    closed: true,
    ...partial,
  };
}

describe("history closed board sync", () => {
  it("builds the same closed/correct counts the strip should show", () => {
    const rows = [
      hist({ id: "pred:win", marketId: "win", correct: true, side: "YES" }),
      hist({
        id: "pred:lose",
        marketId: "lose",
        correct: false,
        side: "NO",
        resolvedOutcome: "Yes",
      }),
    ];
    const summary = summarizeFromHistory(rows, [
      market({ id: "win" }),
      market({ id: "lose" }),
    ]);
    expect(summary.closed).toBe(2);
    expect(summary.evaluable).toBe(2);
    expect(summary.correct).toBe(1);
    expect(summary.incorrect).toBe(1);

    const sides = new Map<string, "YES" | "NO">([
      ["win", "YES"],
      ["lose", "NO"],
    ]);
    const stats = computeMarketStats([], [market({ id: "win" }), market({ id: "lose" })], sides);
    expect(stats.closed).toBe(summary.closed);
    expect(stats.correct).toBe(summary.correct);
    expect(stats.resolvedTotal).toBe(summary.evaluable);
  });

  it("keeps empty history as a synced empty sample", () => {
    const summary = summarizeFromHistory([]);
    const stats = computeMarketStats([], [market({ id: "gamma-only" })], new Map());
    expect(summary.closed).toBe(0);
    expect(stats.closed).toBe(0);
    expect(stats.correct).toBeNull();
  });
});
