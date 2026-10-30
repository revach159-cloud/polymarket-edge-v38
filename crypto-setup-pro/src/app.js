/**
 * Browser app — Engine V1 production + V2 shadow overlays.
 * Production labels ALWAYS come from V1.
 */

import {
  ENGINE_VERSION,
  C,
  trend,
  rsi,
  atr,
  adx,
  vol,
  structure,
  spread,
  rr,
  hist,
  scoreFromFeatures,
  applyOpportunityLabel,
  paperStats,
} from "./engine-v1.js";
import {
  SHADOW_ENGINE_VERSION,
  runShadowBundle,
  shadowCalibration,
  wilsonLowerBound,
} from "./shadow.js";

const $ = (x) => document.getElementById(x);

let rows = [];
let market = { regime: "NEUTRAL" };
let macro = { fng: null, fngClass: "—", btcDom: null, ethBtc: null };
let timer;
let journal = JSON.parse(localStorage.getItem("precision_journal_v3") || "[]");
let state = JSON.parse(localStorage.getItem("precision_state_v2") || "{}");
let lastCalibration = { status: "INSUFFICIENT_DATA", sample: 0 };

const save = () => {
  localStorage.setItem(
    "precision_journal_v3",
    JSON.stringify(journal.slice(-2000)),
  );
  localStorage.setItem("precision_state_v2", JSON.stringify(state));
};

async function J(path) {
  let e;
  for (const h of ["https://api.bybit.com", "https://api.bytick.com"]) {
    try {
      const r = await fetch(h + path);
      const j = await r.json();
      if (r.ok && j.retCode === 0) return j;
      e = Error(j.retMsg || r.status);
    } catch (x) {
      e = x;
    }
  }
  throw e || Error("Bybit unavailable");
}

async function K(s, i) {
  const j = await J(
    `/v5/market/kline?category=linear&symbol=${s}&interval=${i}&limit=180`,
  );
  return j.result.list
    .reverse()
    .map((x) => ({ h: +x[2], l: +x[3], c: +x[4], v: +x[5] }))
    .slice(0, -1);
}

async function OI(s) {
  try {
    const j = await J(
      `/v5/market/open-interest?category=linear&symbol=${s}&intervalTime=15min&limit=12`,
    );
    const a = j.result.list;
    return (+a[0].openInterest / +a.at(-1).openInterest - 1) * 100;
  } catch {
    return null;
  }
}

async function loadMacro(t) {
  const b = t.find((x) => x.symbol === "BTCUSDT");
  const e = t.find((x) => x.symbol === "ETHUSDT");
  macro.ethBtc = b && e ? +e.lastPrice / +b.lastPrice : null;
  try {
    const j = await (
      await fetch("https://api.alternative.me/fng/?limit=1&format=json")
    ).json();
    const d = j.data?.[0];
    macro.fng = d ? +d.value : null;
    macro.fngClass = d?.value_classification || "—";
  } catch {
    /* optional */
  }
  try {
    const j = await (
      await fetch("https://api.coingecko.com/api/v3/global")
    ).json();
    macro.btcDom = +j.data?.market_cap_percentage?.btc || null;
  } catch {
    /* optional */
  }
}

async function regime() {
  const a = await Promise.all([
    K("BTCUSDT", "5"),
    K("BTCUSDT", "15"),
    K("BTCUSDT", "60"),
    K("BTCUSDT", "240"),
    K("ETHUSDT", "60"),
    K("ETHUSDT", "240"),
  ]);
  const s = a.map(trend).reduce((x, y) => x + y, 0);
  market.regime = s >= 3 ? "BULL" : s <= -3 ? "BEAR" : "NEUTRAL";
}

function openTrade(r, st) {
  if (journal.some((x) => x.symbol === r.symbol && x.status === "OPEN")) return;
  journal.push({
    id: r.symbol + "_" + Date.now(),
    symbol: r.symbol,
    side: r.label,
    status: "OPEN",
    entry: st.entry,
    stop: st.stop,
    tp1: st.tp1,
    tp2: st.tp2,
    quality: r.score,
    openedAt: Date.now(),
    r: null,
    snapshot: r,
    engine: ENGINE_VERSION,
  });
  save();
}

function closeTrade(s, p, why) {
  const j = [...journal].reverse().find((x) => x.symbol === s && x.status === "OPEN");
  if (!j) return;
  const risk = Math.abs(j.entry - j.stop) || 1e-9;
  j.exit = p;
  j.closedAt = Date.now();
  j.reason = why;
  j.r = (j.side === "LONG" ? p - j.entry : j.entry - p) / risk;
  j.status = j.r > 0 ? "WIN" : "LOSS";
  save();
}

async function analyze(t) {
  const capturedAtMs = Date.now();
  const [m5, a, b, c] = await Promise.all([
    K(t.symbol, "5"),
    K(t.symbol, "15"),
    K(t.symbol, "60"),
    K(t.symbol, "240"),
  ]);

  const t5 = trend(m5);
  const t15 = trend(a);
  const t1 = trend(b);
  const t4 = trend(c);
  const sum = t5 + t15 + t1 + t4;
  const sideHint = sum >= 0 ? "LONG" : "SHORT";
  const p = +t.lastPrice;
  const A = adx(b);
  const R = rsi(b.map((x) => x.c));
  const V = vol(a);
  const F = (+t.fundingRate || 0) * 100;
  const at = atr(b);
  const stop = sideHint === "LONG" ? p - at : p + at;
  const RR = rr(b, sideHint, p, stop);
  const S = structure(b);
  const spreadPct = spread(t);
  const turnover24h = +t.turnover24h;
  const historical = hist(journal, t.symbol, sideHint);

  // Pre-score without OI to decide whether to fetch (matches live pre>=7)
  const preScore = scoreFromFeatures({
    t5,
    t15,
    t1,
    t4,
    marketRegime: market.regime,
    R,
    A,
    V,
    F,
    RR,
    S,
    turnover24h,
    spreadPct,
    oi: null,
    includeOi: false,
    historical,
    fng: macro.fng,
  });

  let oi = null;
  let includeOi = false;
  if (preScore.passed >= 7) {
    oi = await OI(t.symbol);
    includeOi = true;
  }

  const v1 = scoreFromFeatures({
    t5,
    t15,
    t1,
    t4,
    marketRegime: market.regime,
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
    fng: macro.fng,
  });

  const atrPct = p ? (at / p) * 100 : null;

  const shadow = runShadowBundle({
    now: capturedAtMs,
    v1,
    data: {
      klines1h: b,
      price: p,
      volumeRatio: V,
      turnover24h,
      spreadPct,
      atrPct,
      capturedAtMs,
    },
  });

  // PRODUCTION row — V1 only for label/score
  const r = {
    symbol: t.symbol,
    label: v1.label,
    score: v1.score,
    components: {
      technical: v1.technical,
      derivatives: v1.derivatives,
      regime: v1.regimeScore,
      sentiment: v1.sentiment,
      historical: v1.historical,
    },
    p,
    t5,
    t15,
    t1,
    t4,
    R,
    A,
    V,
    F,
    oi,
    RR,
    g: v1.g,
    anti: v1.anti,
    passed: v1.passed,
    side: v1.side,
    agree: v1.agree,
    gateCount: v1.gateCount,
    macro: { ...macro },
    engine: ENGINE_VERSION,
    shadow,
  };

  let st = state[t.symbol] || (state[t.symbol] = {});
  if ((r.label === "LONG" || r.label === "SHORT") && !st.active) {
    Object.assign(st, {
      active: r.label,
      entry: p,
      stop,
      tp1: sideHint === "LONG" ? p + 1.5 * at : p - 1.5 * at,
      tp2: sideHint === "LONG" ? p + 2.5 * at : p - 2.5 * at,
    });
    openTrade(r, st);
  }
  if (st.active) {
    let w = null;
    if (
      (st.active === "LONG" && p <= st.stop) ||
      (st.active === "SHORT" && p >= st.stop)
    ) {
      w = "Stop Loss";
    }
    if (
      (st.active === "LONG" && p >= st.tp2) ||
      (st.active === "SHORT" && p <= st.tp2)
    ) {
      w = "TP2";
    }
    if (w) {
      closeTrade(t.symbol, p, w);
      state[t.symbol] = {};
    }
  }
  save();
  return r;
}

function render() {
  const q = $("search").value.toUpperCase();
  const a = rows.filter((x) => x.symbol.includes(q));
  $("body").innerHTML = a
    .map((x) => {
      const sh = x.shadow || {};
      const q100 = sh.quality?.quality100 ?? "—";
      const smart = sh.smart?.smartScore ?? "—";
      const prem = sh.premium?.isPremium ? "★" : "—";
      const stance = sh.agreement?.stance ?? "—";
      const dq = sh.dataQuality?.status ?? "—";
      return `<tr>
        <td class="coin">${x.symbol.replace("USDT", "")}/USDT</td>
        <td class="${
          x.label === "LONG"
            ? "long"
            : x.label === "SHORT"
              ? "short"
              : x.label.startsWith("WATCH")
                ? "watch"
                : x.label.startsWith("BEST")
                  ? "best"
                  : x.label.startsWith("NEAR")
                    ? "near"
                    : "muted"
        }">${x.label}</td>
        <td>${x.score}</td>
        <td>${Math.round(x.components.technical)}/${Math.round(x.components.derivatives)}/${Math.round(x.components.sentiment)}</td>
        <td>${x.p}</td>
        <td>${x.t5}/${x.t15}/${x.t1}/${x.t4}</td>
        <td>${x.R.toFixed(1)}</td>
        <td>${x.A.toFixed(1)}</td>
        <td>${x.V.toFixed(2)}×</td>
        <td>${x.F.toFixed(4)}%</td>
        <td>${x.oi == null ? "—" : x.oi.toFixed(2) + "%"}</td>
        <td>${x.RR.toFixed(2)}</td>
        <td>${x.passed}/10</td>
        <td class="shadow-cell" title="Shadow only — does not change production">${q100}</td>
        <td class="shadow-cell">${typeof smart === "number" ? smart.toFixed(3) : smart}</td>
        <td class="shadow-cell">${prem}</td>
        <td class="shadow-cell">${stance}</td>
        <td class="shadow-cell">${dq}</td>
        <td><button type="button" data-audit="${x.symbol}">פתח</button></td>
      </tr>`;
    })
    .join("");

  $("body").onclick = (ev) => {
    const btn = ev.target.closest("[data-audit]");
    if (btn) audit(btn.getAttribute("data-audit"));
  };

  const n = rows
    .filter((x) => x.label.startsWith("WATCH") || x.label.startsWith("NEAR"))
    .slice(0, 20);
  $("watchlist").innerHTML =
    n
      .map(
        (x) =>
          `<tr><td>${x.symbol.replace("USDT", "")}</td><td>${x.side}</td><td>${x.score}</td><td>${x.passed}/10</td><td>${x.anti.slice(0, 3).join(", ")}</td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="5">אין מועמדים קרובים</td></tr>';

  $("regime").textContent = market.regime;
  $("fng").textContent =
    macro.fng == null ? "—" : macro.fng + " " + macro.fngClass;
  $("btcd").textContent =
    macro.btcDom == null ? "—" : macro.btcDom.toFixed(1) + "%";
  $("ethbtc").textContent =
    macro.ethBtc == null ? "—" : macro.ethBtc.toFixed(5);
  $("longs").textContent = rows.filter((x) => x.label === "LONG").length;
  $("shorts").textContent = rows.filter((x) => x.label === "SHORT").length;
  const b = rows.find((x) => x.label.startsWith("BEST")) || rows[0];
  $("best").textContent = b
    ? b.symbol.replace("USDT", "") + " " + b.score
    : "—";

  const s = paperStats(journal);
  $("closed").textContent = s.c;
  $("wr").textContent = s.wr == null ? "—" : s.wr.toFixed(1) + "%";
  $("tr").textContent = s.r.toFixed(2) + "R";
  $("db").textContent = `מאגר פעיל · ${journal.length} · ${ENGINE_VERSION}+${SHADOW_ENGINE_VERSION}`;

  lastCalibration = shadowCalibration(journal);
  const wins = journal.filter((x) => x.status === "WIN").length;
  const closed = journal.filter(
    (x) => x.status === "WIN" || x.status === "LOSS",
  ).length;
  const wilson =
    closed > 0 ? Math.round(wilsonLowerBound(wins, closed) * 100) : null;
  $("calib").textContent =
    lastCalibration.status === "INSUFFICIENT_DATA"
      ? `אין מספיק נתונים (n=${lastCalibration.sample})`
      : `ECE ${lastCalibration.ece} · Wilson≥${wilson}% · n=${lastCalibration.sample}`;

  $("journal").innerHTML =
    [...journal]
      .reverse()
      .slice(0, 100)
      .map(
        (j) =>
          `<tr><td>${j.symbol.replace("USDT", "")}</td><td>${j.side}</td><td>${j.status}</td><td>${j.entry}</td><td>${j.exit ?? "—"}</td><td>${j.r == null ? "—" : j.r.toFixed(2) + "R"}</td><td>${j.quality}</td><td>${new Date(j.openedAt).toLocaleString("he-IL")}</td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="8">אין עסקאות עדיין</td></tr>';
}

function audit(sym) {
  const x = rows.find((r) => r.symbol === sym);
  if (!x) return;
  const sh = x.shadow || {};
  $("title").textContent = `${sym} — AI Audit (${ENGINE_VERSION})`;
  $("detail").innerHTML = `
    <div class="row"><span>החלטה / Edge (V1 ייצור)</span><b>${x.label} / ${x.score}</b></div>
    <div class="row"><span>Technical</span><b>${Math.round(x.components.technical)}/100</b></div>
    <div class="row"><span>Derivatives</span><b>${Math.round(x.components.derivatives)}/100</b></div>
    <div class="row"><span>Regime</span><b>${Math.round(x.components.regime)}/100</b></div>
    <div class="row"><span>Sentiment</span><b>${Math.round(x.components.sentiment)}/100</b></div>
    <div class="row"><span>Historical</span><b>${Math.round(x.components.historical)}/100</b></div>
    <div class="row"><span>אישורים V1</span><b>${Object.entries(x.g)
      .filter((z) => z[1])
      .map((z) => z[0])
      .join(", ")}</b></div>
    <div class="row"><span>חסרים/סיכון V1</span><b>${x.anti.join(", ") || "אין"}</b></div>
    <hr/>
    <div class="row"><span>Shadow engine</span><b>${SHADOW_ENGINE_VERSION} · לא משפיע על ייצור</b></div>
    <div class="row"><span>Data quality</span><b>${sh.dataQuality?.status || "—"} (${sh.dataQuality?.freshness || "—"})</b></div>
    <div class="row"><span>Shadow quality</span><b>${sh.quality?.quality100 ?? "—"}/100</b></div>
    <div class="row"><span>Smart rank</span><b>${sh.smart?.smartScore ?? "—"}</b></div>
    <div class="row"><span>Premium flag</span><b>${sh.premium?.isPremium ? "YES" : "no"} (${sh.premium?.reason || ""})</b></div>
    <div class="row"><span>Agreement</span><b>${sh.agreement?.stance || "—"} · ${(sh.agreement?.supporting || []).join(", ")}</b></div>
    <div class="row"><span>Conflicts</span><b>${(sh.agreement?.conflicting || []).join(", ") || "אין"}</b></div>
    <div class="row"><span>Shadow note</span><b>${sh.shadowNote || sh.error || "—"}</b></div>
  `;
  $("dlg").showModal();
}

async function scan() {
  clearInterval(timer);
  $("scan").disabled = true;
  $("status").textContent = "סורק…";
  try {
    await regime();
    const j = await J("/v5/market/tickers?category=linear");
    await loadMacro(j.result.list);
    const a = j.result.list
      .filter((x) => x.symbol.endsWith("USDT") && +x.turnover24h > 0)
      .sort((x, y) => +y.turnover24h - +x.turnover24h)
      .slice(0, +$("limit").value);
    const out = [];
    for (let i = 0; i < a.length; i += 6) {
      const z = await Promise.allSettled(a.slice(i, i + 6).map(analyze));
      z.forEach((v) => v.status === "fulfilled" && out.push(v.value));
      $("bar").style.width = Math.min(100, ((i + 6) / a.length) * 100) + "%";
      $("status").textContent = `${Math.min(i + 6, a.length)}/${a.length}`;
    }
    rows = out.sort((a, b) => b.score - a.score);
    rows = applyOpportunityLabel(rows, journal, $("mode").value);
    // Optional shadow sort key for display only when toggled
    if ($("shadowSort")?.checked) {
      rows = [...rows].sort(
        (a, b) =>
          (b.shadow?.smart?.smartScore ?? 0) - (a.shadow?.smart?.smartScore ?? 0),
      );
    }
    render();
    $("status").textContent = "נסרקו " + rows.length;
  } catch (e) {
    $("status").textContent = "שגיאה: " + e.message;
  } finally {
    $("scan").disabled = false;
    const s = +$("refresh").value;
    if (s) timer = setInterval(scan, s * 1000);
  }
}

function exportJournal() {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          version: 3,
          engine: ENGINE_VERSION,
          shadowEngine: SHADOW_ENGINE_VERSION,
          exportedAt: new Date().toISOString(),
          journal,
          calibration: shadowCalibration(journal),
          note: "BASELINE export — no fabricated metrics",
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `csp-journal-${Date.now()}.json`;
  a.click();
}

$("scan").onclick = scan;
$("search").oninput = render;
$("limit").onchange = scan;
$("mode").onchange = () => {
  rows = applyOpportunityLabel(rows, journal, $("mode").value);
  render();
};
$("refresh").onchange = scan;
$("close").onclick = () => $("dlg").close();
$("exportJournal").onclick = exportJournal;
if ($("shadowSort")) $("shadowSort").onchange = () => scan();

$("engineTag").textContent = `${ENGINE_VERSION} prod · ${SHADOW_ENGINE_VERSION}`;
scan();
