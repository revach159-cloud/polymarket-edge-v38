import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  getTimeBucket,
  isWithinDisplayHorizon,
  TIME_BUCKET_PRIORITY,
} from "@/lib/predictions/time-buckets";
import { brierScore, clamp01, logLoss, wilsonLowerBound } from "@/lib/analytics/stats";
import { scoreMarket } from "@/lib/predictions/scoring";
import { canAccessAdmin, canAccessGoldPicks } from "@/lib/permissions";
import { getSafeRedirectPath } from "@/lib/redirect";
import { clampProbability } from "@/lib/predictions/config";

describe("time buckets", () => {
  const now = new Date("2026-03-22T12:00:00.000Z");

  it("classifies horizons", () => {
    expect(getTimeBucket(new Date(now.getTime() + 30 * 60_000), now)).toBe("within_2h");
    expect(getTimeBucket(new Date(now.getTime() + 40 * 86_400_000), now)).toBe("beyond_30d");
    expect(getTimeBucket(new Date(now.getTime() - 1_000), now)).toBe("closed");
  });

  it("filters display horizon", () => {
    expect(isWithinDisplayHorizon(new Date(now.getTime() + 10 * 86_400_000), now)).toBe(true);
    expect(isWithinDisplayHorizon(new Date(now.getTime() + 40 * 86_400_000), now)).toBe(false);
  });

  it("priority ordering prefers sooner buckets", () => {
    expect(TIME_BUCKET_PRIORITY.within_2h).toBeLessThan(TIME_BUCKET_PRIORITY.within_30d);
  });

  it("formats countdown", () => {
    expect(formatCountdown(new Date(now.getTime() + 90 * 60_000), now)).toContain("ש");
  });
});

describe("stats", () => {
  it("wilson / brier / logloss", () => {
    expect(wilsonLowerBound(8, 10)).toBeGreaterThan(0.4);
    expect(brierScore([0.7, 0.2], [1, 0])).toBeCloseTo(0.065, 3);
    expect(logLoss([0.9], [1])).toBeLessThan(0.2);
    expect(clamp01(2)).toBe(1);
    expect(clampProbability(1.2)).toBe(1);
  });
});

describe("scoring", () => {
  it("scores a liquid near-term market", () => {
    const result = scoreMarket({
      marketProbability: 0.55,
      yesPrice: 0.55,
      noPrice: 0.45,
      spread: 0.02,
      volume: 100_000,
      liquidity: 40_000,
      hoursToEnd: 4,
      walletConsensusScore: 0.6,
      category: "politics",
      freshness: "fresh",
    });
    expect(result.quality_score_100).toBeGreaterThan(0);
    expect(result.fair_probability).toBeGreaterThan(0);
    expect(result.side === "yes" || result.side === "no").toBe(true);
  });
});

describe("permissions", () => {
  it("gates gold and admin", () => {
    expect(canAccessGoldPicks("free", "free")).toBe(false);
    expect(canAccessGoldPicks("gold", "gold")).toBe(true);
    expect(canAccessAdmin("admin")).toBe(true);
  });
});

describe("redirect safety", () => {
  it("blocks open redirects", () => {
    expect(getSafeRedirectPath("https://evil.com")).toBe("/account");
    expect(getSafeRedirectPath("/markets")).toBe("/markets");
  });
});
