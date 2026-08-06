import { describe, expect, it } from "vitest";
import { inferMarketResolution } from "@/lib/markets/resolution";
import { computeMarketStats } from "@/lib/markets/stats";
import { formatShortDate } from "@/lib/utils";
import type { Market } from "@/types";

function market(partial: Partial<Market>): Market {
  return {
    id: "1",
    slug: "test",
    question: "Will it happen?",
    volume: 0,
    liquidity: 0,
    outcomes: [],
    active: true,
    closed: false,
    ...partial,
  };
}

describe("inferMarketResolution", () => {
  it("marks open markets as open", () => {
    expect(inferMarketResolution(market({ closed: false })).label).toBe("פתוח");
  });

  it("detects a resolved YES outcome and correctness", () => {
    const resolution = inferMarketResolution(
      market({
        closed: true,
        selectedOutcome: "YES",
        outcomes: [
          { id: "y", name: "Yes", price: 0.99 },
          { id: "n", name: "No", price: 0.01 },
        ],
      }),
    );
    expect(resolution.label).toBe("Yes");
    expect(resolution.side).toBe("YES");
    expect(resolution.correct).toBe(true);
  });

  it("returns unresolved when prices are not decisive", () => {
    const resolution = inferMarketResolution(
      market({
        closed: true,
        outcomes: [
          { id: "y", name: "Yes", price: 0.6 },
          { id: "n", name: "No", price: 0.4 },
        ],
      }),
    );
    expect(resolution.label).toBe("טרם הוכרע");
    expect(resolution.correct).toBeNull();
  });
});

describe("computeMarketStats", () => {
  it("summarizes active and closed markets from the same closed list", () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    const closed = [
      market({
        id: "c1",
        closed: true,
        active: false,
        outcomes: [
          { id: "y", name: "Yes", price: 0.99 },
          { id: "n", name: "No", price: 0.01 },
        ],
      }),
      market({
        id: "c2",
        closed: true,
        active: false,
        outcomes: [
          { id: "y", name: "Yes", price: 0.99 },
          { id: "n", name: "No", price: 0.01 },
        ],
      }),
    ];
    const sides = new Map<string, "YES" | "NO">([
      ["c1", "YES"],
      ["c2", "NO"],
    ]);
    const stats = computeMarketStats(
      [
        market({
          id: "a",
          active: true,
          closed: false,
          endDate: new Date(now.getTime() + 60 * 60_000).toISOString(),
          volume: 10,
          liquidity: 5,
        }),
      ],
      closed,
      sides,
      now,
    );
    expect(stats.active).toBe(1);
    expect(stats.within2h).toBe(1);
    expect(stats.closed).toBe(2);
    expect(stats.correct).toBe(1);
    expect(stats.resolvedTotal).toBe(2);
    expect(stats.winRateLabel).toContain("50%");
  });
});

describe("formatShortDate", () => {
  it("formats valid dates", () => {
    expect(formatShortDate("2026-08-05T00:00:00.000Z")).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });
});
