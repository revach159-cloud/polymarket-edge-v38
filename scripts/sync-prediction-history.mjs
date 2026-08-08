/**
 * Rebuild public/prediction-history.json from live Polymarket Gamma data.
 * Standalone (no path aliases) so it runs in CI without Next.
 *
 * Usage: node scripts/sync-prediction-history.mjs
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const GAMMA = process.env.POLYMARKET_GAMMA_API_URL || "https://gamma-api.polymarket.com";
const OUT = path.join(process.cwd(), "public", "prediction-history.json");
const VERSION = 4;

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function outcomesOf(raw) {
  const names = parseJsonArray(raw.outcomes);
  const prices = parseJsonArray(raw.outcomePrices).map(Number);
  return names.map((name, i) => ({
    name: String(name),
    price: Number.isFinite(prices[i]) ? prices[i] : 0,
  }));
}

function yesNoSide(outcomes) {
  const yes = outcomes.find((o) => /^yes$/i.test(o.name));
  const no = outcomes.find((o) => /^no$/i.test(o.name));
  if (yes && no) {
    if (yes.price >= 0.95) return { resolved: "YES", pick: "YES" };
    if (no.price >= 0.95) return { resolved: "NO", pick: "NO" };
    return {
      resolved: null,
      pick: yes.price >= no.price ? "YES" : "NO",
      yes: yes.price,
    };
  }
  // Multi-outcome: decisive winner ≥ 0.95
  const winner = outcomes.reduce(
    (best, o) => (o.price > (best?.price ?? -1) ? o : best),
    null,
  );
  if (winner && winner.price >= 0.95) {
    return { resolved: "YES", pick: "YES", label: winner.name };
  }
  return { resolved: null, pick: null };
}

async function fetchPaged({ closed, pages = 5, pageSize = 100 }) {
  const all = [];
  for (let i = 0; i < pages; i++) {
    const url = new URL(`${GAMMA}/markets`);
    url.searchParams.set("closed", String(closed));
    url.searchParams.set("active", String(!closed));
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(i * pageSize));
    url.searchParams.set("order", closed ? "updatedAt" : "volume24hr");
    url.searchParams.set("ascending", "false");
    const res = await fetch(url);
    if (!res.ok) break;
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < pageSize) break;
  }
  return all;
}

function loadPrevious() {
  try {
    if (!existsSync(OUT)) return [];
    const parsed = JSON.parse(readFileSync(OUT, "utf8"));
    if (parsed?.version !== VERSION || !Array.isArray(parsed.predictions)) return [];
    return parsed.predictions;
  } catch {
    return [];
  }
}

function rank(row) {
  const statusBoost = row.status === "resolved" ? (row.correct != null ? 3 : 2) : 1;
  const time = Date.parse(row.resolvedAt ?? row.recordedAt) || 0;
  return statusBoost * 1e13 + time;
}

function compact(rows) {
  const byMarket = new Map();
  for (const row of rows) {
    const prev = byMarket.get(row.marketId);
    if (!prev || rank(row) >= rank(prev)) byMarket.set(row.marketId, row);
  }
  const bySlug = new Map();
  for (const row of byMarket.values()) {
    const key = row.slug?.trim()?.toLowerCase() || `id:${row.marketId}`;
    const prev = bySlug.get(key);
    if (!prev || rank(row) >= rank(prev)) {
      bySlug.set(key, { ...row, id: `pred:${row.marketId}` });
    }
  }
  return [...bySlug.values()];
}

async function main() {
  const previous = loadPrevious();
  const [activeRaw, closedRaw] = await Promise.all([
    fetchPaged({ closed: false, pages: 6 }),
    fetchPaged({ closed: true, pages: 5 }),
  ]);

  const now = new Date().toISOString();
  const opens = [];
  for (const raw of activeRaw) {
    if (raw.closed || raw.active === false) continue;
    const outcomes = outcomesOf(raw);
    const side = yesNoSide(outcomes);
    if (!side.pick) continue;
    if (side.yes != null && (side.yes >= 0.98 || side.yes <= 0.02)) continue;
    const id = String(raw.id ?? raw.conditionId ?? "");
    const slug = String(raw.slug ?? id);
    if (!id || !slug) continue;
    opens.push({
      id: `pred:${id}`,
      marketId: id,
      slug,
      marketQuestion: String(raw.question ?? slug),
      side: side.pick,
      marketProbability: side.yes ?? null,
      modelProbability: side.yes ?? null,
      edgeScore: null,
      qualityScore: null,
      walletConsensusScore: null,
      recordedAt: now,
      status: "open",
      resolvedAt: null,
      resolvedOutcome: null,
      correct: null,
      source: "live-sync",
    });
  }

  const priorById = new Map(previous.map((p) => [p.marketId, p]));
  const priorBySlug = new Map(
    previous
      .filter((p) => p.slug)
      .map((p) => [String(p.slug).toLowerCase(), p]),
  );

  const resolved = [];
  for (const raw of closedRaw) {
    const outcomes = outcomesOf(raw);
    const side = yesNoSide(outcomes);
    if (!side.resolved) continue;
    const id = String(raw.id ?? raw.conditionId ?? "");
    const slug = String(raw.slug ?? id);
    if (!id || !slug) continue;
    // Honest only: require a side recorded while the market was still open.
    const prior =
      priorById.get(id) ?? priorBySlug.get(slug.toLowerCase()) ?? null;
    if (!prior?.side) continue;
    resolved.push({
      id: `pred:${id}`,
      marketId: id,
      slug,
      marketQuestion: String(raw.question ?? slug),
      side: prior.side,
      marketProbability: prior.marketProbability ?? null,
      modelProbability: prior.modelProbability ?? null,
      edgeScore: prior.edgeScore ?? null,
      qualityScore: prior.qualityScore ?? null,
      walletConsensusScore: null,
      recordedAt: prior.recordedAt ?? now,
      status: "resolved",
      resolvedAt: raw.closedTime || raw.updatedAt || now,
      resolvedOutcome: side.label ?? side.resolved,
      correct: prior.side === side.resolved,
      source: "live-sync",
    });
  }

  // Keep prior graded rows + newly resolved + current opens (cap graded).
  const priorGraded = previous.filter(
    (p) => p.status === "resolved" && p.correct != null,
  );
  const graded = compact([...priorGraded, ...resolved])
    .filter((r) => r.status === "resolved" && r.correct != null)
    .sort((a, b) => Date.parse(b.resolvedAt) - Date.parse(a.resolvedAt))
    .slice(0, 500);

  const predictions = compact([...opens, ...graded]);
  const payload = {
    version: VERSION,
    updatedAt: now,
    predictions,
  };

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const openN = predictions.filter((p) => p.status === "open").length;
  const resolvedN = predictions.filter(
    (p) => p.status === "resolved" && p.correct != null,
  ).length;
  const correctN = predictions.filter((p) => p.correct === true).length;
  console.log(
    JSON.stringify(
      {
        ok: true,
        outFile: OUT,
        open: openN,
        resolved: resolvedN,
        correct: correctN,
        winRate:
          resolvedN > 0 ? `${Math.round((correctN / resolvedN) * 100)}%` : null,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
