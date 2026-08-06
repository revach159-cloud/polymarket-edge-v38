import { describe, expect, it } from "vitest";
import { pickCloseTime } from "@/lib/polymarket/api";
import { computeEdge } from "@/lib/predictions/edge";
import { isQualityPrediction, selectDailyPredictions } from "@/lib/markets/quality-gate";
import { computeMarketStats } from "@/lib/markets/stats";
import type { Market } from "@/types";

function market(partial: Partial<Market> & Pick<Market, "id" | "question">): Market {
  return {
    slug: partial.slug ?? partial.id,
    volume: 1_000,
    liquidity: 2_000,
    outcomes: [
      { id: "y", name: "Yes", price: 0.8 },
      { id: "n", name: "No", price: 0.2 },
    ],
    active: true,
    closed: false,
    selectedOutcome: "YES",
    marketProbability: 0.8,
    qualityScore: 70,
    ...partial,
  };
}

describe("pickCloseTime", () => {
  it("prefers full timestamp over date-only iso", () => {
    expect(pickCloseTime("2026-08-06T09:00:00Z", "2026-08-06")).toBe(
      "2026-08-06T09:00:00Z",
    );
  });
});

describe("computeEdge win-probability lock", () => {
  it("locks to YES favorite when market is strongly skewed", () => {
    const edge = computeEdge(0.55, 0.82);
    expect(edge.side).toBe("yes");
    expect(edge.win_probability).toBeGreaterThanOrEqual(0.82);
  });

  it("locks to NO favorite when market is strongly skewed down", () => {
    const edge = computeEdge(0.4, 0.18);
    expect(edge.side).toBe("no");
    expect(edge.win_probability).toBeGreaterThanOrEqual(0.82);
  });

  it("does not favorite-lock extreme 98%+ markets", () => {
    const edge = computeEdge(0.55, 0.99);
    // Falls through to fair-vs-market; quality gate will reject anyway.
    expect(edge.win_probability).toBeLessThan(0.99);
  });
});

describe("quality gate + daily target", () => {
  const now = new Date("2026-08-06T12:00:00.000Z");

  it("keeps high-conviction near-close markets", () => {
    const m = market({
      id: "near",
      question: "near",
      endDate: new Date(now.getTime() + 90 * 60_000).toISOString(),
      marketProbability: 0.78,
      selectedOutcome: "YES",
      liquidity: 800,
      qualityScore: 55,
    });
    expect(isQualityPrediction(m, now)).toBe(true);
  });

  it("drops coin-flip far markets", () => {
    const m = market({
      id: "far",
      question: "far",
      endDate: new Date(now.getTime() + 48 * 3_600_000).toISOString(),
      marketProbability: 0.51,
      selectedOutcome: "YES",
      qualityScore: 80,
      liquidity: 5_000,
    });
    expect(isQualityPrediction(m, now)).toBe(false);
  });

  it("rejects 98-100% one-sided locks with no payout", () => {
    const lockedYes = market({
      id: "lock-yes",
      question: "temp",
      endDate: new Date(now.getTime() + 90 * 60_000).toISOString(),
      marketProbability: 0.99,
      selectedOutcome: "YES",
      qualityScore: 90,
      liquidity: 10_000,
      volume: 5_000,
    });
    const lockedNo = market({
      id: "lock-no",
      question: "temp-no",
      endDate: new Date(now.getTime() + 90 * 60_000).toISOString(),
      marketProbability: 0.01,
      selectedOutcome: "NO",
      qualityScore: 90,
      liquidity: 10_000,
      volume: 5_000,
    });
    expect(isQualityPrediction(lockedYes, now)).toBe(false);
    expect(isQualityPrediction(lockedNo, now)).toBe(false);
  });

  it("keeps tradable favorites under the 97% cap", () => {
    const m = market({
      id: "tradeable",
      question: "tradeable",
      endDate: new Date(now.getTime() + 90 * 60_000).toISOString(),
      marketProbability: 0.86,
      selectedOutcome: "YES",
      qualityScore: 70,
      liquidity: 2_000,
      volume: 1_000,
    });
    expect(isQualityPrediction(m, now)).toBe(true);
  });

  it("orders near-close first and can exceed 250 when available", () => {
    const rows: Market[] = [];
    for (let i = 0; i < 280; i += 1) {
      const hours = i < 40 ? 1 : i < 120 ? 4 : 20;
      rows.push(
        market({
          id: `m-${i}`,
          question: `q-${i}`,
          endDate: new Date(now.getTime() + hours * 3_600_000).toISOString(),
          marketProbability: 0.72,
          selectedOutcome: "YES",
          liquidity: 1_000,
          volume: 500,
          qualityScore: 60,
          smartScore: 0.5,
        }),
      );
    }
    const selected = selectDailyPredictions(rows, now, 250);
    expect(selected.length).toBeGreaterThanOrEqual(250);
    const firstHours =
      (new Date(selected[0]!.endDate!).getTime() - now.getTime()) / 3_600_000;
    expect(firstHours).toBeLessThanOrEqual(2);
  });
});

describe("win rate stats display", () => {
  it("shows clean empty/reset state with glowing zeros ready", () => {
    const stats = computeMarketStats([], [], null);
    expect(stats.closed).toBe(0);
    expect(stats.correct).toBeNull();
    expect(stats.winRatePercent).toBeNull();
    expect(stats.winRateLabel).toBe("אין מדגם");
    expect(stats.within5h).toBe(0);
  });

  it("reports percent + wilson from closed markets + recorded sides", () => {
    const closed = Array.from({ length: 20 }, (_, i) => ({
      id: `m${i}`,
      slug: `m${i}`,
      question: `Q ${i}`,
      volume: 0,
      liquidity: 0,
      active: false,
      closed: true,
      outcomes: [
        { id: "y", name: "Yes", price: 0.99 },
        { id: "n", name: "No", price: 0.01 },
      ],
    }));
    const sides = new Map(
      closed.map((m, i) => [m.id, i < 14 ? ("YES" as const) : ("NO" as const)]),
    );
    const stats = computeMarketStats([], closed, sides);
    expect(stats.correct).toBe(14);
    expect(stats.resolvedTotal).toBe(20);
    expect(stats.closed).toBe(20);
    expect(stats.winRatePercent).toBe(70);
    expect(stats.winRateLabel).toBe("70%");
    expect(stats.winRateWilson).toBeGreaterThan(0);
    expect(stats.winRateWilson).toBeLessThanOrEqual(70);
  });
});
