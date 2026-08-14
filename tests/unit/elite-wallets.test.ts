import { describe, expect, it } from "vitest";
import {
  ELITE_MIN_PNL,
  evaluateEliteWallet,
  eliteLossLabelHe,
  formatProfitFactor,
  scoreEliteWallet,
  summarizeClosedPnls,
  walletDisplayName,
} from "@/lib/wallets/elite";

describe("summarizeClosedPnls", () => {
  it("treats an all-win sample as zero losses with capped profit factor", () => {
    const summary = summarizeClosedPnls([12_000, 4_500, 800, 2_200]);
    expect(summary.sampleSize).toBe(4);
    expect(summary.wins).toBe(4);
    expect(summary.losses).toBe(0);
    expect(summary.winRate).toBe(1);
    expect(summary.lossShare).toBe(0);
    expect(summary.grossLosses).toBe(0);
    expect(summary.profitFactor).toBe(99);
    expect(summary.worstLoss).toBe(0);
    expect(summary.bestWin).toBe(12_000);
  });

  it("computes profit factor and loss share from mixed results", () => {
    const summary = summarizeClosedPnls([10_000, 5_000, -1_000, -500]);
    expect(summary.wins).toBe(2);
    expect(summary.losses).toBe(2);
    expect(summary.grossWins).toBe(15_000);
    expect(summary.grossLosses).toBe(1_500);
    expect(summary.profitFactor).toBe(10);
    expect(summary.lossShare).toBeCloseTo(1_500 / 16_500);
    expect(summary.winRate).toBe(0.5);
    expect(summary.worstLoss).toBe(-1_000);
  });

  it("returns empty-safe zeros", () => {
    const summary = summarizeClosedPnls([]);
    expect(summary.sampleSize).toBe(0);
    expect(summary.winRate).toBe(0);
    expect(summary.profitFactor).toBe(0);
    expect(summary.lossShare).toBe(0);
    expect(summary.wilsonLowerBound).toBe(0);
  });
});

describe("evaluateEliteWallet", () => {
  const monsterClosed = Array.from({ length: 20 }, (_, i) => (i === 19 ? -400 : 8_000));

  it("accepts high PnL, high win rate, and tiny dollar losses", () => {
    const result = evaluateEliteWallet({
      pnl: 180_000,
      volume: 900_000,
      closedPnls: monsterClosed,
      openUnrealizedLoss: 1_200,
    });
    expect(result.eligible).toBe(true);
    expect(result.winRate).toBe(0.95);
    expect(result.profitFactor).toBeGreaterThan(4);
    expect(result.lossLabel).toBe("tiny");
    expect(result.roi).toBeCloseTo(180_000 / 900_000);
    expect(result.score).toBeGreaterThan(0);
    expect(eliteLossLabelHe(result.lossLabel)).toBe("הפסדים זעירים");
  });

  it("rejects market-maker style 50/50 flow even with huge PnL", () => {
    const closed = Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? 2_000 : -1_800));
    const result = evaluateEliteWallet({
      pnl: 800_000,
      volume: 40_000_000,
      closedPnls: closed,
      openUnrealizedLoss: 500,
    });
    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
  });

  it("rejects wallets that realize winners while sitting on huge open losses", () => {
    const closed = Array.from({ length: 30 }, () => 12_000);
    const result = evaluateEliteWallet({
      pnl: 250_000,
      closedPnls: closed,
      openUnrealizedLoss: 1_200_000,
    });
    expect(result.eligible).toBe(false);
  });

  it("rejects a tiny lucky streak below the sample floor", () => {
    const result = evaluateEliteWallet({
      pnl: 80_000,
      closedPnls: [20_000, 15_000, 9_000],
      openUnrealizedLoss: 0,
    });
    expect(result.eligible).toBe(false);
    expect(result.sampleSize).toBeLessThan(8);
  });

  it("rejects PnL below the floor", () => {
    const result = evaluateEliteWallet({
      pnl: ELITE_MIN_PNL - 1,
      closedPnls: Array.from({ length: 20 }, () => 3_000),
      openUnrealizedLoss: 0,
    });
    expect(result.eligible).toBe(false);
  });

  it("allows modest open inventory when closed losses are tiny", () => {
    const closed = Array.from({ length: 16 }, () => 7_500);
    const result = evaluateEliteWallet({
      pnl: 120_000,
      closedPnls: closed,
      openUnrealizedLoss: 20_000,
    });
    expect(result.eligible).toBe(true);
    expect(result.lossLabel).toBe("none");
    expect(eliteLossLabelHe("none")).toBe("בלי הפסדים בדגימה");
  });
});

describe("scoreEliteWallet", () => {
  it("ranks a larger sample of clean wins above a noisier one at the same PnL", () => {
    const clean = summarizeClosedPnls(Array.from({ length: 40 }, () => 5_000));
    const noisier = summarizeClosedPnls([
      ...Array.from({ length: 30 }, () => 5_000),
      ...Array.from({ length: 10 }, () => -800),
    ]);
    expect(scoreEliteWallet(200_000, clean)).toBeGreaterThan(scoreEliteWallet(200_000, noisier));
  });
});

describe("formatProfitFactor", () => {
  it("renders the cap as infinity and keeps one decimal below 10", () => {
    expect(formatProfitFactor(99)).toBe("∞");
    expect(formatProfitFactor(12.4)).toBe("12");
    expect(formatProfitFactor(4.25)).toBe("4.3");
  });
});

describe("walletDisplayName", () => {
  it("keeps a human username", () => {
    expect(walletDisplayName("theowalcott", "0x7ad71d79a3bb90d0a87a06500fa0fe11663842aa")).toBe(
      "theowalcott",
    );
  });

  it("falls back to the address when the username is a proxy hash", () => {
    const address = "0xe30e74595517de48f1fb19f4553dd3d9f1e96b87";
    expect(walletDisplayName(`${address}-1772612985000`, address)).toBe(address);
    expect(walletDisplayName(null, address)).toBe(address);
  });
});
