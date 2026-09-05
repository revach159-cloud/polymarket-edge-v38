/**
 * ENGINE V1 — Precision Crypto Engine (PROTECTED BASELINE)
 *
 * Source of truth: https://crypto-setup-pro.vercel.app (live HTML, 2026-08-10 audit)
 * Do not change scoring/gate/label behavior without an explicit version bump to V2 production.
 *
 * This module exposes pure helpers used by both the browser app and regression tests.
 */

export const ENGINE_VERSION = "v1";

export const C = Object.freeze({
  enter: 91,
  watch: 79,
  best: 76,
});

export function ema(a, p) {
  let k = 2 / (p + 1);
  let e = a[0];
  for (let i = 1; i < a.length; i++) e = a[i] * k + e * (1 - k);
  return e;
}

export function rsi(a, p = 14) {
  let g = 0;
  let l = 0;
  for (let i = a.length - p; i < a.length; i++) {
    const d = a[i] - a[i - 1];
    d >= 0 ? (g += d) : (l -= d);
  }
  return l ? 100 - 100 / (1 + g / p / (l / p)) : 100;
}

/** +1 bullish EMA stack, -1 bearish, 0 mixed */
export function trend(k) {
  const c = k.map((x) => x.c);
  const a = ema(c, 20);
  const b = ema(c, 50);
  const z = c.at(-1);
  return z > a && a > b ? 1 : z < a && a < b ? -1 : 0;
}

export function atr(k) {
  const q = [];
  for (let i = 1; i < k.length; i++) {
    q.push(
      Math.max(
        k[i].h - k[i].l,
        Math.abs(k[i].h - k[i - 1].c),
        Math.abs(k[i].l - k[i - 1].c),
      ),
    );
  }
  return q.slice(-14).reduce((a, b) => a + b, 0) / 14;
}

/** Simplified ADX-like strength (original live formula). */
export function adx(k) {
  const t = [];
  const p = [];
  const m = [];
  for (let i = 1; i < k.length; i++) {
    const u = k[i].h - k[i - 1].h;
    const d = k[i - 1].l - k[i].l;
    p.push(u > d && u > 0 ? u : 0);
    m.push(d > u && d > 0 ? d : 0);
    t.push(
      Math.max(
        k[i].h - k[i].l,
        Math.abs(k[i].h - k[i - 1].c),
        Math.abs(k[i].l - k[i - 1].c),
      ),
    );
  }
  const T = t.slice(-14).reduce((a, b) => a + b, 0);
  const P = p.slice(-14).reduce((a, b) => a + b, 0);
  const M = m.slice(-14).reduce((a, b) => a + b, 0);
  return T ? (100 * Math.abs(P - M)) / (P + M || 1) : 0;
}

export function vol(k) {
  const q = k.slice(-21);
  const a = q.slice(0, -1).reduce((s, x) => s + x.v, 0) / 20;
  return q.at(-1).v / (a || 1);
}

export function structure(k) {
  const q = k.slice(-30);
  const z = q.at(-1);
  const h = Math.max(...q.slice(0, -3).map((x) => x.h));
  const l = Math.min(...q.slice(0, -3).map((x) => x.l));
  return z.c > h ? 1 : z.c < l ? -1 : 0;
}

export function spread(t) {
  const b = +t.bid1Price;
  const a = +t.ask1Price;
  return b && a ? ((a - b) / ((a + b) / 2)) * 100 : 999;
}

export function rr(k, s, p, st) {
  const q = k.slice(-80);
  const o =
    s === "LONG" ? Math.max(...q.map((x) => x.h)) : Math.min(...q.map((x) => x.l));
  return Math.max(0, (s === "LONG" ? o - p : p - o) / (Math.abs(p - st) || 1e-9));
}

/**
 * Historical component from closed journal rows (same symbol+side).
 * Matches live hist().
 */
export function hist(journal, sym, side) {
  const a = journal.filter(
    (x) => x.symbol === sym && x.side === side && x.status !== "OPEN",
  );
  return a.length < 3
    ? 55
    : Math.max(
        20,
        Math.min(90, 35 + (a.filter((x) => x.status === "WIN").length / a.length) * 55),
      );
}

export function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Build the 10+ OI gate object and scores from precomputed features.
 * Pure — suitable for golden regression tests.
 */
export function scoreFromFeatures(input) {
  const {
    t5,
    t15,
    t1,
    t4,
    marketRegime,
    R,
    A,
    V,
    F,
    RR,
    S,
    turnover24h,
    spreadPct,
    oi,
    includeOi,
    historical,
    fng,
  } = input;

  const sum = t5 + t15 + t1 + t4;
  const side = sum >= 0 ? "LONG" : "SHORT";
  const dir = side === "LONG" ? 1 : -1;
  const agree = [t5, t15, t1, t4].filter((x) => x === dir).length;

  const g = {
    market:
      marketRegime !== "NEUTRAL" &&
      (side === "LONG" ? marketRegime === "BULL" : marketRegime === "BEAR"),
    agreement: agree >= 3,
    structure: side === "LONG" ? S > 0 : S < 0,
    momentum: side === "LONG" ? R > 50 && R < 74 : R < 50 && R > 26,
    adx: A >= 18,
    volume: V >= 1.02,
    funding: Math.abs(F) <= 0.06,
    liquidity: turnover24h >= 1.2e7 && spreadPct <= 0.1,
    rr: RR >= 1.6,
    trigger: t5 === dir && t15 === dir,
  };

  if (includeOi) {
    g.oi = oi !== null && oi !== undefined && oi > 0;
  }

  const passed = Object.values(g).filter(Boolean).length;
  const technical = Math.min(100, 42 + passed * 5 + agree * 2);
  const derivatives = Math.max(
    0,
    Math.min(
      100,
      55 + (oi ?? 0) * 5 - Math.abs(F) * 280 + (g.funding ? 12 : -8),
    ),
  );
  const sentiment =
    fng == null ? 50 : side === "LONG" ? fng : 100 - fng;
  const regimeScore = g.market ? 92 : marketRegime === "NEUTRAL" ? 50 : 28;
  const score = Math.round(
    technical * 0.42 +
      derivatives * 0.24 +
      regimeScore * 0.14 +
      sentiment * 0.1 +
      historical * 0.1,
  );

  // Live app hardcodes passed===10 for enter (even when oi makes 11 gates).
  // Preserve exactly for Engine V1 regression.
  let label = "NO TRADE";
  if (passed === 10 && score >= C.enter) label = side;
  else if (passed >= 8 && score >= C.watch) label = `WATCH ${side}`;
  else if (passed >= 7) label = `NEAR ${side}`;

  const anti = Object.entries(g)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  return {
    engine: ENGINE_VERSION,
    side,
    dir,
    agree,
    g,
    passed,
    gateCount: Object.keys(g).length,
    technical,
    derivatives,
    sentiment,
    regimeScore,
    historical,
    score,
    label,
    anti,
  };
}

/**
 * Opportunity mode: BEST AVAILABLE when no LONG/SHORT and idle ≥24h.
 */
export function applyOpportunityLabel(rows, journal, mode, now = Date.now()) {
  if (mode !== "opportunity") return rows;
  if (rows.some((x) => x.label === "LONG" || x.label === "SHORT")) return rows;
  const last = Math.max(0, ...journal.map((x) => x.openedAt || 0));
  if (now - last < 864e5 || !rows.length) return rows;
  const copy = rows.map((r) => ({ ...r }));
  const b =
    copy.find((x) => x.score >= C.best && x.passed >= 7) || copy[0];
  if (b) b.label = `BEST AVAILABLE ${b.side}`;
  return copy;
}

export function paperStats(journal) {
  const c = journal.filter((x) => x.status !== "OPEN");
  const w = c.filter((x) => x.status === "WIN");
  return {
    c: c.length,
    wr: c.length ? (w.length / c.length) * 100 : null,
    r: c.reduce((s, x) => s + (x.r || 0), 0),
  };
}
