import { describe, expect, it, beforeEach } from "vitest";
import {
  getHistoryStoreSnapshot,
  importHistoryPredictions,
  listHistoryPredictions,
  recordOpenPredictions,
  resetPredictionHistory,
  resolveClosedPredictions,
  type HistoryPrediction,
} from "@/lib/history/prediction-store";
import type { Market } from "@/types";

function market(partial: Partial<Market>): Market {
  return {
    id: partial.id ?? "m1",
    slug: partial.slug ?? "test-market",
    question: partial.question ?? "Will it win?",
    volume: 1_000,
    liquidity: 1_000,
    outcomes: [
      { id: "y", name: "Yes", price: 0.62 },
      { id: "n", name: "No", price: 0.38 },
    ],
    active: true,
    closed: false,
    selectedOutcome: "YES",
    marketProbability: 0.62,
    ...partial,
  };
}

function row(
  partial: Partial<HistoryPrediction> & Pick<HistoryPrediction, "id" | "marketId">,
): HistoryPrediction {
  return {
    slug: "s",
    marketQuestion: "q",
    side: "YES",
    marketProbability: 0.6,
    modelProbability: 0.62,
    edgeScore: 0.02,
    qualityScore: 70,
    walletConsensusScore: null,
    recordedAt: "2026-08-06T10:00:00.000Z",
    status: "open",
    resolvedAt: null,
    resolvedOutcome: null,
    correct: null,
    source: "live-sync",
    ...partial,
  };
}

describe("durable history merge", () => {
  beforeEach(() => {
    resetPredictionHistory();
  });

  it("merges durable resolved rows into an empty local store", () => {
    const loaded = importHistoryPredictions([
      row({
        id: "pred:a",
        marketId: "a",
        slug: "team-a",
        status: "resolved",
        resolvedAt: "2026-08-07T12:00:00.000Z",
        resolvedOutcome: "Yes",
        correct: true,
      }),
    ]);
    expect(loaded).toBe(1);
    expect(listHistoryPredictions({ status: "resolved" })).toHaveLength(1);
    expect(getHistoryStoreSnapshot().predictions[0]?.correct).toBe(true);
  });

  it("prefers resolved rows when merging open + resolved for same market", () => {
    const merged = importHistoryPredictions([
      row({
        id: "pred:a",
        marketId: "a",
        slug: "team-a",
        status: "open",
        recordedAt: "2026-08-08T12:00:00.000Z",
      }),
      row({
        id: "pred:a",
        marketId: "a",
        slug: "team-a",
        status: "resolved",
        recordedAt: "2026-08-06T10:00:00.000Z",
        resolvedAt: "2026-08-07T12:00:00.000Z",
        resolvedOutcome: "Yes",
        correct: true,
      }),
    ]);
    expect(merged).toBeGreaterThanOrEqual(1);
    const resolved = listHistoryPredictions({ status: "resolved", limit: 10 });
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.correct).toBe(true);
    expect(listHistoryPredictions({ status: "open", limit: 10 })).toHaveLength(0);
  });

  it("does not wipe opens when a closed-only resolve races a record", () => {
    const open = market({
      id: "keep-me",
      slug: "keep-me",
      selectedOutcome: "YES",
      active: true,
      closed: false,
    });

    // Classic TOCTOU that used to zero נסגרו on /markets:
    // 1) closed path reads empty snapshot
    // 2) active path records opens into live memory
    // 3) closed path writeStore(stale empty) must merge, not replace.
    const closedStale = [
      market({
        id: "other-closed",
        slug: "other-closed",
        active: false,
        closed: true,
        outcomes: [
          { id: "y", name: "Yes", price: 0.99 },
          { id: "n", name: "No", price: 0.01 },
        ],
      }),
    ];

    // Begin closed resolve (captures empty copy)...
    const midResolve = () => resolveClosedPredictions(closedStale);
    // ...but record opens before/around that write.
    recordOpenPredictions([open]);
    midResolve();
    recordOpenPredictions([open]);
    resolveClosedPredictions(closedStale);

    const opens = listHistoryPredictions({ status: "open" });
    expect(opens.some((p) => p.marketId === "keep-me")).toBe(true);
    expect(getHistoryStoreSnapshot().predictions.length).toBeGreaterThan(0);
  });
});
