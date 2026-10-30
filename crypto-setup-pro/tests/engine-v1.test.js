import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  C,
  ENGINE_VERSION,
  scoreFromFeatures,
  hist,
  applyOpportunityLabel,
  paperStats,
  trend,
  ema,
} from "../src/engine-v1.js";

function baseGates(overrides = {}) {
  return {
    t5: 1,
    t15: 1,
    t1: 1,
    t4: 1,
    marketRegime: "BULL",
    R: 58,
    A: 22,
    V: 1.2,
    F: 0.01,
    RR: 2,
    S: 1,
    turnover24h: 5e7,
    spreadPct: 0.05,
    oi: null,
    includeOi: false,
    historical: 55,
    fng: 55,
    ...overrides,
  };
}

describe("Engine V1 protected baseline", () => {
  it("exposes v1 version and enter thresholds", () => {
    assert.equal(ENGINE_VERSION, "v1");
    assert.equal(C.enter, 91);
    assert.equal(C.watch, 79);
    assert.equal(C.best, 76);
  });

  it("can emit LONG when passed===10 and score>=91 (OI boost + one soft miss)", () => {
    // Live quirk: including passing OI makes 11 gates so passed===11 blocks enter.
    // Achievable path: OI fetched & positive (boosts derivatives) while exactly one
    // other gate fails → passed stays 10 and score can clear 91.
    const r = scoreFromFeatures(
      baseGates({
        includeOi: true,
        oi: 6,
        rr: false, // fail rr gate via RR below — set RR low
        RR: 1.0,
        historical: 80,
        fng: 70,
        F: 0.01,
      }),
    );
    assert.equal(r.g.oi, true);
    assert.equal(r.g.rr, false);
    assert.equal(r.passed, 10);
    assert.ok(r.score >= 91, `score ${r.score}`);
    assert.equal(r.label, "LONG");
  });

  it("blocks enter when all 11 gates pass (passed===11 quirk)", () => {
    const r = scoreFromFeatures(
      baseGates({ includeOi: true, oi: 6, historical: 90, fng: 90 }),
    );
    assert.equal(r.passed, 11);
    assert.ok(r.score >= 91);
    assert.notEqual(r.label, "LONG");
  });

  it("returns WATCH / NEAR / NO TRADE tiers", () => {
    const watch = scoreFromFeatures(
      baseGates({
        marketRegime: "NEUTRAL", // fails market
        A: 10, // fails adx
        historical: 40,
        fng: 40,
      }),
    );
    assert.ok(watch.passed >= 7);
    assert.ok(
      watch.label.startsWith("WATCH") ||
        watch.label.startsWith("NEAR") ||
        watch.label === "NO TRADE",
    );

    const none = scoreFromFeatures(
      baseGates({
        t5: 0,
        t15: 0,
        t1: -1,
        t4: -1,
        marketRegime: "BEAR",
        R: 20,
        A: 5,
        V: 0.5,
        F: 0.2,
        RR: 0.5,
        S: 0,
        turnover24h: 1e5,
        spreadPct: 1,
      }),
    );
    assert.equal(none.side, "SHORT");
    assert.ok(none.passed < 7);
    assert.equal(none.label, "NO TRADE");
  });

  it("hist defaults to 55 with small sample", () => {
    assert.equal(hist([], "BTCUSDT", "LONG"), 55);
    assert.equal(
      hist(
        [
          { symbol: "BTCUSDT", side: "LONG", status: "WIN" },
          { symbol: "BTCUSDT", side: "LONG", status: "LOSS" },
        ],
        "BTCUSDT",
        "LONG",
      ),
      55,
    );
  });

  it("opportunity mode only when idle 24h and no live trades", () => {
    const rows = [
      { label: "NEAR LONG", side: "LONG", score: 80, passed: 7 },
    ];
    const out = applyOpportunityLabel(rows, [], "opportunity", Date.now());
    assert.equal(out[0].label, "BEST AVAILABLE LONG");

    const blocked = applyOpportunityLabel(
      [{ label: "LONG", side: "LONG", score: 95, passed: 10 }],
      [],
      "opportunity",
      Date.now(),
    );
    assert.equal(blocked[0].label, "LONG");
  });

  it("paperStats reports null wr with empty journal", () => {
    const s = paperStats([]);
    assert.equal(s.c, 0);
    assert.equal(s.wr, null);
    assert.equal(s.r, 0);
  });

  it("trend detects EMA stack", () => {
    const up = [];
    let p = 100;
    for (let i = 0; i < 60; i++) {
      p += 1;
      up.push({ h: p + 1, l: p - 1, c: p, v: 1000 });
    }
    assert.equal(trend(up), 1);
    assert.ok(Number.isFinite(ema(up.map((x) => x.c), 20)));
  });
});
