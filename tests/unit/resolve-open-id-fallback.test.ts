import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGammaMarketBySlug } from "@/lib/polymarket/api";
import {
  recordOpenPredictions,
  resolveClosedPredictions,
  listHistoryPredictions,
  resetPredictionHistory,
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
      { id: "y", name: "Up", price: 0.55 },
      { id: "n", name: "Down", price: 0.45 },
    ],
    active: true,
    closed: false,
    selectedOutcome: "YES",
    marketProbability: 0.55,
    ...partial,
  };
}

describe("gamma id fallback + resolve matching", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetPredictionHistory();
  });

  it("falls back to /markets/{id} when ?slug= returns empty", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);
        if (url.includes("markets?slug=")) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.endsWith("/markets/ghost-slug")) {
          return new Response(JSON.stringify({}), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.endsWith("/markets/3361096")) {
          return new Response(
            JSON.stringify({
              id: "3361096",
              slug: "ghost-slug",
              question: "ZEC up or down?",
              closed: true,
              active: false,
              outcomes: '["Up","Down"]',
              outcomePrices: '["0","1"]',
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }),
    );

    const { market: found, error } = await fetchGammaMarketBySlug(
      "ghost-slug",
      "3361096",
    );
    expect(error).toBeUndefined();
    expect(found?.id).toBe("3361096");
    expect(found?.closed).toBe(true);
    expect(calls.some((u) => u.includes("markets?slug="))).toBe(true);
    expect(calls.some((u) => u.endsWith("/markets/3361096"))).toBe(true);
  });

  it("resolves open history by slug when gamma id string differs", () => {
    const open = market({
      id: "local-1",
      slug: "same-slug",
      selectedOutcome: "NO",
      marketProbability: 0.42,
    });
    expect(recordOpenPredictions([open])).toBeGreaterThanOrEqual(1);

    const closed = market({
      id: "gamma-other-id",
      slug: "same-slug",
      closed: true,
      active: false,
      outcomes: [
        { id: "y", name: "Up", price: 0 },
        { id: "n", name: "Down", price: 1 },
      ],
    });
    expect(resolveClosedPredictions([closed])).toBeGreaterThanOrEqual(1);
    const resolved = listHistoryPredictions({ status: "resolved", limit: 0 });
    expect(
      resolved.some((p) => p.slug === "same-slug" && p.correct === true),
    ).toBe(true);
  });
});
