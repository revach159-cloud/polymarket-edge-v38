import { describe, expect, it } from "vitest";
import {
  applySmartSearch,
  computeSmartScore,
  scoreSearchRelevance,
} from "@/lib/markets/smart-rank";
import {
  liveResolvedFromClosed,
  recordOpenPredictions,
  resolveClosedPredictions,
  listHistoryPredictions,
} from "@/lib/history/prediction-store";
import type { Market } from "@/types";

function market(partial: Partial<Market>): Market {
  return {
    id: partial.id ?? "1",
    slug: partial.slug ?? "test-market",
    question: partial.question ?? "Will Bitcoin rise?",
    volume: 10_000,
    liquidity: 5_000,
    outcomes: [
      { id: "y", name: "Yes", price: 0.55 },
      { id: "n", name: "No", price: 0.45 },
    ],
    active: true,
    closed: false,
    qualityScore: 70,
    edgeScore: 0.04,
    selectedOutcome: "YES",
    ...partial,
  };
}

describe("smart rank / search", () => {
  it("matches hebrew/english category synonyms", () => {
    const m = market({ category: "Sports", question: "Lakers vs Celtics" });
    expect(scoreSearchRelevance(m, "ספורט")).toBeGreaterThan(0.3);
    expect(scoreSearchRelevance(m, "crypto")).toBe(0);
  });

  it("filters and ranks by relevance", () => {
    const list = applySmartSearch(
      [
        market({ id: "1", question: "Bitcoin above 100k?", category: "Crypto" }),
        market({ id: "2", question: "Election winner?", category: "Politics" }),
      ],
      "bitcoin",
    );
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("1");
  });

  it("scores smart ranking with wallet consensus", () => {
    const base = computeSmartScore(market({ walletConsensusScore: 0.5 }));
    const lean = computeSmartScore(
      market({ walletConsensusScore: 0.8, walletSupportCount: 4, goldPick: true }),
    );
    expect(lean).toBeGreaterThan(base);
  });
});

describe("prediction history sync", () => {
  it("records open picks and resolves closed markets", () => {
    const open = market({
      id: `open-${Date.now()}`,
      slug: `open-${Date.now()}`,
      selectedOutcome: "YES",
    });
    expect(recordOpenPredictions([open])).toBeGreaterThanOrEqual(1);

    const closed = market({
      id: open.id,
      slug: open.slug,
      closed: true,
      active: false,
      selectedOutcome: "YES",
      outcomes: [
        { id: "y", name: "Yes", price: 1 },
        { id: "n", name: "No", price: 0 },
      ],
    });
    expect(resolveClosedPredictions([closed])).toBeGreaterThanOrEqual(1);
    const resolved = listHistoryPredictions({ status: "resolved", limit: 50 });
    expect(resolved.some((p) => p.marketId === open.id && p.correct === true)).toBe(
      true,
    );
  });

  it("builds live resolved rows from closed markets", () => {
    const rows = liveResolvedFromClosed([
      market({
        closed: true,
        selectedOutcome: "NO",
        outcomes: [
          { id: "y", name: "Yes", price: 0 },
          { id: "n", name: "No", price: 1 },
        ],
      }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.correct).toBe(true);
  });
});
