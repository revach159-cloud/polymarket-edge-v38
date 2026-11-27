import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dataQualityGate,
  shadowQualityScore,
  shadowPremiumTier,
  shadowSmartRank,
  shadowAgreementReport,
  shadowCalibration,
  runShadowBundle,
  wilsonLowerBound,
  SHADOW_ENGINE_VERSION,
} from "../src/shadow.js";

describe("Shadow adapters (non-production)", () => {
  it("data quality rejects bad inputs", () => {
    const bad = dataQualityGate({
      klines1h: [],
      price: -1,
      volumeRatio: NaN,
      turnover24h: -5,
      spreadPct: 999,
      capturedAtMs: null,
    });
    assert.equal(bad.ok, false);
    assert.equal(bad.status, "INSUFFICIENT_DATA");
    assert.ok(bad.reasons.includes("insufficient_klines"));
  });

  it("data quality accepts sane inputs", () => {
    const bars = Array.from({ length: 60 }, (_, i) => ({
      h: 110 + i,
      l: 100 + i,
      c: 105 + i,
      v: 1000,
    }));
    const ok = dataQualityGate({
      klines1h: bars,
      price: 165,
      volumeRatio: 1.2,
      turnover24h: 5e7,
      spreadPct: 0.05,
      capturedAtMs: Date.now(),
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.freshness, "fresh");
  });

  it("quality score is finite 0–100", () => {
    const q = shadowQualityScore({
      confidence01: 0.8,
      spreadPct: 0.05,
      turnover24h: 5e7,
      volumeRatio: 1.3,
      gateValues: { a: true, b: true, c: false },
    });
    assert.ok(q.quality100 >= 0 && q.quality100 <= 100);
  });

  it("premium requires full agree + quality", () => {
    const no = shadowPremiumTier({
      dataOk: true,
      freshness: "fresh",
      quality01: 0.8,
      score: 95,
      passed: 10,
      gateCount: 10,
      agree: 4,
      anti: ["funding"],
    });
    assert.equal(no.isPremium, false);

    const yes = shadowPremiumTier({
      dataOk: true,
      freshness: "fresh",
      quality01: 0.8,
      score: 95,
      passed: 10,
      gateCount: 10,
      agree: 4,
      anti: [],
    });
    assert.equal(yes.isPremium, true);
  });

  it("agreement marks CONFLICTED when many antis", () => {
    const r = shadowAgreementReport(
      { a: true, b: false, c: false, d: false },
      ["b", "c", "d"],
    );
    assert.equal(r.stance, "CONFLICTED");
    assert.equal(r.softDampen, true);
  });

  it("calibration reports INSUFFICIENT_DATA under n=10", () => {
    const c = shadowCalibration([
      { status: "WIN", quality: 90 },
      { status: "LOSS", quality: 80 },
    ]);
    assert.equal(c.status, "INSUFFICIENT_DATA");
    assert.equal(c.ece, null);
  });

  it("runShadowBundle never overrides production label", () => {
    const bars = Array.from({ length: 60 }, (_, i) => ({
      h: 110,
      l: 100,
      c: 105,
      v: 1000,
    }));
    const out = runShadowBundle({
      now: Date.now(),
      v1: {
        label: "LONG",
        score: 93,
        passed: 10,
        gateCount: 10,
        agree: 4,
        anti: [],
        g: {
          market: true,
          agreement: true,
          structure: true,
          momentum: true,
          adx: true,
          volume: true,
          funding: true,
          liquidity: true,
          rr: true,
          trigger: true,
        },
      },
      data: {
        klines1h: bars,
        price: 100,
        volumeRatio: 1.2,
        turnover24h: 5e7,
        spreadPct: 0.04,
        atrPct: 0.9,
        capturedAtMs: Date.now(),
      },
    });
    assert.equal(out.affectsProduction, false);
    assert.equal(out.productionLabel, "LONG");
    assert.equal(out.engine, SHADOW_ENGINE_VERSION);
    assert.ok(out.smart.smartScore > 0);
  });

  it("wilson lower bound is below raw rate for small n", () => {
    const lb = wilsonLowerBound(8, 10);
    assert.ok(lb < 0.8);
    assert.ok(lb > 0.4);
  });

  it("smart rank is higher with premium + agreement", () => {
    const low = shadowSmartRank({
      quality01: 0.4,
      score: 70,
      agree: 2,
      passed: 7,
      gateCount: 10,
      atrPct: 0.3,
      isPremium: false,
      sideAlignedRegime: false,
    });
    const high = shadowSmartRank({
      quality01: 0.85,
      score: 95,
      agree: 4,
      passed: 10,
      gateCount: 10,
      atrPct: 1.2,
      isPremium: true,
      sideAlignedRegime: true,
    });
    assert.ok(high.smartScore > low.smartScore);
  });
});
