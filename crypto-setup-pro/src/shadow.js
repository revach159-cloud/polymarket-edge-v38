/**
 * Shadow adapters — Polymarket Daily Edge transferable ideas.
 * NEVER change Engine V1 production labels.
 * All outputs are advisory / shadow until validated.
 */

import { clamp01 } from "./engine-v1.js";

export const SHADOW_ENGINE_VERSION = "v2-shadow";

/**
 * Data quality gate (PM freshness + emit hygiene, crypto-adapted).
 * Returns { ok, reasons, freshness }.
 */
export function dataQualityGate(input, now = Date.now()) {
  const reasons = [];
  const {
    klines1h,
    price,
    volumeRatio,
    turnover24h,
    spreadPct,
    capturedAtMs,
  } = input;

  if (!Array.isArray(klines1h) || klines1h.length < 55) {
    reasons.push("insufficient_klines");
  }
  if (!Number.isFinite(price) || price <= 0) reasons.push("invalid_price");
  if (!Number.isFinite(volumeRatio) || volumeRatio < 0) {
    reasons.push("invalid_volume");
  }
  if (!Number.isFinite(turnover24h) || turnover24h < 0) {
    reasons.push("invalid_turnover");
  }
  if (!Number.isFinite(spreadPct) || spreadPct < 0 || spreadPct >= 999) {
    reasons.push("invalid_or_missing_spread");
  }
  if (klines1h) {
    for (const bar of klines1h.slice(-5)) {
      if (
        !Number.isFinite(bar.h) ||
        !Number.isFinite(bar.l) ||
        !Number.isFinite(bar.c) ||
        !Number.isFinite(bar.v) ||
        bar.h < bar.l
      ) {
        reasons.push("nan_or_impossible_ohlcv");
        break;
      }
    }
  }

  let freshness = "unavailable";
  if (capturedAtMs != null && Number.isFinite(capturedAtMs)) {
    const age = now - capturedAtMs;
    if (age < 0) freshness = "fresh";
    else if (age <= 2 * 60_000) freshness = "fresh";
    else if (age <= 15 * 60_000) freshness = "delayed";
    else freshness = "stale";
    if (freshness === "stale") reasons.push("stale_data");
  }

  return {
    ok: reasons.length === 0,
    reasons,
    freshness,
    status: reasons.length ? "INSUFFICIENT_DATA" : "OK",
  };
}

/**
 * Quality composite adapted from Polymarket computeQuality.
 * Uses crypto-native inputs (not YES/NO probability).
 * Returns 0–1 and /100.
 */
export function shadowQualityScore(input) {
  const {
    confidence01,
    spreadPct,
    turnover24h,
    volumeRatio,
    gateValues, // boolean map or 0/1 values for stability
  } = input;

  const maxSpread = 0.1; // CSP liquidity gate uses 0.1%
  const minLiquidity = 1.2e7;
  const minVolumeRatio = 1.02;

  const spreadScore =
    spreadPct == null || !Number.isFinite(spreadPct) || spreadPct >= 999
      ? 0.5
      : clamp01(1 - spreadPct / Math.max(maxSpread, 1e-6));

  const liquidityScore = clamp01(turnover24h / Math.max(minLiquidity * 5, 1));
  const volumeScore = clamp01(volumeRatio / Math.max(minVolumeRatio * 5, 1));

  const vals = Array.isArray(gateValues)
    ? gateValues.map((v) => (v ? 1 : 0))
    : Object.values(gateValues || {}).map((v) => (v ? 1 : 0));
  let factorStability = 0.5;
  if (vals.length) {
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance =
      vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    factorStability = clamp01(1 - Math.sqrt(variance) * 1.5);
  }

  const conf = clamp01(confidence01 ?? 0.5);
  const quality = clamp01(
    conf * 0.35 +
      spreadScore * 0.2 +
      liquidityScore * 0.2 +
      volumeScore * 0.15 +
      factorStability * 0.1,
  );

  return {
    quality01: quality,
    quality100: Math.round(quality * 1000) / 10,
    parts: { spreadScore, liquidityScore, volumeScore, factorStability, conf },
  };
}

/**
 * Premium / "Gold-like" tier — stricter filter, NOT a new primary model.
 * Adapted from isGoldCandidate ideas without PM resolution/favorite lock.
 */
export function shadowPremiumTier(input) {
  const {
    dataOk,
    freshness,
    quality01,
    score,
    passed,
    gateCount,
    agree,
    anti,
  } = input;

  if (!dataOk || freshness === "stale" || freshness === "unavailable") {
    return { isPremium: false, reason: "data_quality" };
  }
  if (passed < gateCount) return { isPremium: false, reason: "gates_incomplete" };
  if (score < 91) return { isPremium: false, reason: "score_below_enter" };
  if (quality01 < 0.7) return { isPremium: false, reason: "quality_below" };
  if (agree < 3) return { isPremium: false, reason: "agreement_weak" };
  if ((anti || []).length > 0) return { isPremium: false, reason: "has_anti" };

  return { isPremium: true, reason: "all_premium_checks" };
}

/**
 * Smart-rank overlay adapted from computeSmartScore (crypto analogs).
 * Does not replace V1 score — advisory ranking boost 0–1.
 */
export function shadowSmartRank(input) {
  const {
    quality01,
    score,
    agree,
    passed,
    gateCount,
    atrPct, // ATR/price * 100 — urgency/volatility proxy
    isPremium,
    sideAlignedRegime,
  } = input;

  const quality = clamp01(quality01 ?? 0);
  const edge = Math.min(Math.abs((score ?? 0) / 100) * 1.1, 1);
  const conviction = clamp01((agree ?? 0) / 4);
  const gateFill = clamp01((passed ?? 0) / Math.max(gateCount || 10, 1));

  // Higher ATR% → slightly higher urgency (crypto continuous market)
  const urgency =
    atrPct == null || !Number.isFinite(atrPct)
      ? 0.3
      : atrPct >= 1.5
        ? 1
        : atrPct >= 0.8
          ? 0.75
          : atrPct >= 0.4
            ? 0.55
            : 0.35;

  const regimeLean = sideAlignedRegime ? 0.08 : 0;
  const goldBonus = isPremium ? 0.06 : 0;

  const smart =
    quality * 0.28 +
    edge * 0.14 +
    conviction * 0.22 +
    gateFill * 0.12 +
    urgency * 0.2 +
    goldBonus +
    regimeLean;

  return {
    smartScore: Math.round(smart * 1000) / 1000,
    parts: { quality, edge, conviction, gateFill, urgency, goldBonus, regimeLean },
  };
}

/**
 * Confirmation / conflict report — explainability only.
 * Does NOT invent probability; may suggest soft dampening flag.
 */
export function shadowAgreementReport(g, anti) {
  const entries = Object.entries(g || {});
  const supporting = entries.filter(([, ok]) => ok).map(([k]) => k);
  const conflicting = anti || entries.filter(([, ok]) => !ok).map(([k]) => k);
  const total = entries.length || 1;
  const agreementRatio = supporting.length / total;

  let stance = "NEUTRAL";
  if (conflicting.length === 0 && supporting.length === total) stance = "FULL_AGREE";
  else if (conflicting.length >= 3) stance = "CONFLICTED";
  else if (agreementRatio >= 0.8) stance = "STRONG";
  else if (agreementRatio >= 0.6) stance = "MIXED";
  else stance = "WEAK";

  return {
    supporting,
    conflicting,
    agreementRatio: Math.round(agreementRatio * 1000) / 1000,
    stance,
    // Soft advisory only — production must ignore unless activated later
    softDampen: stance === "CONFLICTED" || stance === "WEAK",
  };
}

/**
 * Calibration buckets from real journal outcomes vs V1 score.
 * Returns null metrics when insufficient data.
 */
export function shadowCalibration(journal, buckets = 5) {
  const closed = (journal || []).filter(
    (x) => x.status === "WIN" || x.status === "LOSS",
  );
  if (closed.length < 10) {
    return {
      status: "INSUFFICIENT_DATA",
      sample: closed.length,
      buckets: [],
      ece: null,
    };
  }

  const width = 100 / buckets;
  const rows = [];
  for (let i = 0; i < buckets; i++) {
    const lo = i * width;
    const hi = (i + 1) * width;
    const inBin = closed.filter((x) => {
      const q = Number(x.quality ?? x.score ?? 0);
      return i === buckets - 1 ? q >= lo && q <= hi : q >= lo && q < hi;
    });
    const n = inBin.length;
    const wins = inBin.filter((x) => x.status === "WIN").length;
    const avgScore = n ? inBin.reduce((s, x) => s + Number(x.quality ?? 0), 0) / n : (lo + hi) / 2;
    const avgActual = n ? wins / n : 0;
    rows.push({
      bin: i,
      lo,
      hi,
      count: n,
      avgPredictedScore: Math.round(avgScore * 10) / 10,
      avgActualWinRate: Math.round(avgActual * 1000) / 1000,
      gap: Math.round((avgScore / 100 - avgActual) * 1000) / 1000,
    });
  }

  const ece =
    rows.reduce((s, b) => s + (b.count / closed.length) * Math.abs(b.gap), 0) ||
    0;

  return {
    status: "OK",
    sample: closed.length,
    buckets: rows,
    ece: Math.round(ece * 1000) / 1000,
  };
}

/**
 * Wilson lower bound for win-rate display (analytics only).
 */
export function wilsonLowerBound(successes, trials, z = 1.96) {
  if (trials <= 0) return 0;
  const p = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const centre = p + z2 / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);
  return Math.max(0, (centre - margin) / denominator);
}

/**
 * Run all shadow adapters for one V1 row + market inputs.
 * Isolated — failures return error status without throwing to caller if wrapped.
 */
export function runShadowBundle(ctx) {
  try {
    const dq = dataQualityGate(ctx.data, ctx.now);
    const conf01 = clamp01((ctx.v1.score ?? 50) / 100);
    const quality = shadowQualityScore({
      confidence01: conf01,
      spreadPct: ctx.data.spreadPct,
      turnover24h: ctx.data.turnover24h,
      volumeRatio: ctx.data.volumeRatio,
      gateValues: ctx.v1.g,
    });
    const premium = shadowPremiumTier({
      dataOk: dq.ok,
      freshness: dq.freshness,
      quality01: quality.quality01,
      score: ctx.v1.score,
      passed: ctx.v1.passed,
      gateCount: ctx.v1.gateCount,
      agree: ctx.v1.agree,
      anti: ctx.v1.anti,
    });
    const smart = shadowSmartRank({
      quality01: quality.quality01,
      score: ctx.v1.score,
      agree: ctx.v1.agree,
      passed: ctx.v1.passed,
      gateCount: ctx.v1.gateCount,
      atrPct: ctx.data.atrPct,
      isPremium: premium.isPremium,
      sideAlignedRegime: Boolean(ctx.v1.g?.market),
    });
    const agreement = shadowAgreementReport(ctx.v1.g, ctx.v1.anti);

    return {
      engine: SHADOW_ENGINE_VERSION,
      mode: "SHADOW",
      affectsProduction: false,
      dataQuality: dq,
      quality,
      premium,
      smart,
      agreement,
      // Explicit: do not override V1
      productionLabel: ctx.v1.label,
      shadowNote: premium.isPremium
        ? "Premium shadow flag (not production)"
        : agreement.stance === "CONFLICTED"
          ? "Conflicted shadow stance"
          : "Shadow OK",
    };
  } catch (err) {
    return {
      engine: SHADOW_ENGINE_VERSION,
      mode: "SHADOW",
      affectsProduction: false,
      error: err instanceof Error ? err.message : String(err),
      status: "ADAPTER_FAILURE",
      productionLabel: ctx.v1?.label ?? null,
    };
  }
}
