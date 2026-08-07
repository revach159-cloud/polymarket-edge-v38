import { describe, expect, it } from "vitest";
import {
  compactHistoryPredictions,
  listHistoryPredictions,
} from "@/lib/history/prediction-store";
import {
  listResolvedHistory,
  summarizeFromHistory,
} from "@/lib/history/closed-board";
import { dedupeMarkets, marketDedupeKey } from "@/lib/markets/dedupe";
import type { HistoryPrediction } from "@/lib/history/prediction-store";
import type { Market } from "@/types";

function market(partial: Partial<Market>): Market {
  return {
    id: "1",
    slug: "s1",
    question: "Will it happen?",
    volume: 0,
    liquidity: 0,
    outcomes: [],
    active: true,
    closed: false,
    ...partial,
  };
}

function hist(partial: Partial<HistoryPrediction>): HistoryPrediction {
  return {
    id: "pred:1",
    marketId: "1",
    slug: "s1",
    marketQuestion: "Will it happen?",
    side: "YES",
    marketProbability: 0.6,
    modelProbability: 0.7,
    edgeScore: 0.1,
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

describe("dedupe markets + history", () => {
  it("dedupes active markets by slug", () => {
    const list = dedupeMarkets([
      market({ id: "a", slug: "btc", qualityScore: 50, liquidity: 100 }),
      market({ id: "b", slug: "btc", qualityScore: 80, liquidity: 500 }),
      market({ id: "c", slug: "eth", qualityScore: 60 }),
    ]);
    expect(list).toHaveLength(2);
    expect(list.find((m) => m.slug === "btc")?.id).toBe("b");
    expect(marketDedupeKey(market({ slug: "btc", conditionId: "x" }))).toBe(
      "cond:x",
    );
  });

  it("compacts history duplicates by marketId and slug", () => {
    const byMarket = compactHistoryPredictions([
      hist({
        id: "pred:1a",
        marketId: "1",
        slug: "one",
        recordedAt: "2026-08-01T00:00:00.000Z",
      }),
      hist({
        id: "pred:1b",
        marketId: "1",
        slug: "one",
        recordedAt: "2026-08-03T00:00:00.000Z",
        resolvedAt: "2026-08-04T00:00:00.000Z",
      }),
    ]);
    expect(byMarket).toHaveLength(1);
    expect(byMarket[0].id).toBe("pred:1");

    const bySlug = compactHistoryPredictions([
      hist({
        id: "pred:1",
        marketId: "1",
        slug: "same",
        recordedAt: "2026-08-01T00:00:00.000Z",
      }),
      hist({
        id: "pred:2",
        marketId: "2",
        slug: "same",
        recordedAt: "2026-08-03T00:00:00.000Z",
        resolvedAt: "2026-08-04T00:00:00.000Z",
      }),
    ]);
    expect(bySlug).toHaveLength(1);
    expect(bySlug[0].marketId).toBe("2");
  });

  it("closed board never repeats the same market twice", () => {
    const summary = summarizeFromHistory([
      hist({ id: "pred:1", marketId: "1", slug: "dup" }),
      hist({ id: "pred:2", marketId: "1", slug: "dup" }),
      hist({ id: "pred:3", marketId: "9", slug: "dup" }),
    ]);
    expect(summary.verdicts).toHaveLength(1);
    expect(summary.closed).toBe(1);
  });

  it("does not silently cap resolved history at 200", () => {
    const rows = Array.from({ length: 250 }, (_, i) =>
      hist({
        id: `pred:${i}`,
        marketId: `m${i}`,
        slug: `slug-m${i}`,
        correct: i % 2 === 0,
      }),
    );
    const summary = summarizeFromHistory(rows);
    expect(summary.closed).toBe(250);
    expect(summary.evaluable).toBe(250);

    // API contract: omit / 0 / Infinity = uncapped (the old default of 200
    // froze הוכרעו on the markets page once the store grew past 200).
    expect(listHistoryPredictions({ status: "resolved", limit: 0 }).length).toBe(
      listHistoryPredictions({ status: "resolved" }).length,
    );
    expect(listResolvedHistory().length).toBe(
      listHistoryPredictions({ status: "resolved", limit: 0 }).length,
    );
  });
});
