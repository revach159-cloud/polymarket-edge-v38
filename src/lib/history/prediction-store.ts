import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { isOneSidedLock } from "@/lib/markets/quality-gate";
import { inferMarketResolution } from "@/lib/markets/resolution";
import type { Market } from "@/types";

export type HistoryPrediction = {
  id: string;
  marketId: string;
  slug: string;
  marketQuestion: string;
  side: "YES" | "NO";
  marketProbability: number | null;
  modelProbability: number | null;
  edgeScore: number | null;
  qualityScore: number | null;
  walletConsensusScore: number | null;
  recordedAt: string;
  status: "open" | "resolved";
  resolvedAt: string | null;
  resolvedOutcome: string | null;
  correct: boolean | null;
  source: "live-sync";
};

/**
 * Bump to wipe inflated / post-close-graded history and restart honest tracking.
 * v3 also clears the closed board (נסגרו + history table) — only pre-close
 * recorded picks reappear after they resolve.
 * v4 compacts duplicate history rows (same marketId / slug).
 */
const STORE_VERSION = 4 as const;

type StoreShape = {
  version: typeof STORE_VERSION;
  updatedAt: string;
  predictions: HistoryPrediction[];
};

const GLOBAL_KEY = "__polymarket_edge_prediction_history__";

function storePath(): string {
  const base =
    process.env.PREDICTION_HISTORY_DIR ||
    (process.env.VERCEL ? "/tmp/polymarket-edge-data" : path.join(process.cwd(), ".data"));
  return path.join(base, "prediction-history.json");
}

function emptyStore(): StoreShape {
  return {
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    predictions: [],
  };
}

function memoryStore(): StoreShape {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: StoreShape;
  };
  if (!g[GLOBAL_KEY] || g[GLOBAL_KEY]!.version !== STORE_VERSION) {
    g[GLOBAL_KEY] = emptyStore();
  }
  return g[GLOBAL_KEY]!;
}

function readStore(): StoreShape {
  const mem = memoryStore();
  try {
    const file = storePath();
    if (!existsSync(file)) return mem;
    const parsed = JSON.parse(readFileSync(file, "utf8")) as StoreShape;
    // Reset any pre-v4 history — clears duplicates / fixtures.
    if (!parsed || parsed.version !== STORE_VERSION) {
      writeStore(emptyStore());
      return memoryStore();
    }
    if (!parsed.predictions || !Array.isArray(parsed.predictions)) return mem;
    const compacted = compactHistoryPredictions(parsed.predictions);
    mem.predictions = compacted;
    mem.updatedAt = parsed.updatedAt ?? mem.updatedAt;
    if (compacted.length !== parsed.predictions.length) {
      writeStore(mem);
    }
    return mem;
  } catch {
    return mem;
  }
}

/** Wipe on-disk + in-memory history (used after model policy changes). */
export function resetPredictionHistory(): void {
  const empty = emptyStore();
  writeStore(empty);
  try {
    const file = storePath();
    if (existsSync(file)) writeFileSync(file, JSON.stringify(empty, null, 2), "utf8");
  } catch {
    // ignore
  }
}

function writeStore(store: StoreShape): void {
  store.updatedAt = new Date().toISOString();
  memoryStore().predictions = store.predictions;
  memoryStore().updatedAt = store.updatedAt;
  try {
    const file = storePath();
    mkdirSync(path.dirname(file), { recursive: true });
    // Compact JSON — pretty-print ballooned to multi‑MB and stalled page resolves.
    writeFileSync(file, JSON.stringify(store), "utf8");
  } catch {
    // Filesystem may be read-only in some runtimes; memory still works for the process.
  }
}

function historyRank(row: HistoryPrediction): number {
  const resolvedBoost = row.status === "resolved" ? 1_000_000 : 0;
  const time = Date.parse(row.resolvedAt ?? row.recordedAt) || 0;
  return resolvedBoost + time;
}

/**
 * One row per marketId and per slug — prefer resolved, then newest.
 * Also drops synthetic fixture ids from local demos.
 */
export function compactHistoryPredictions(
  predictions: HistoryPrediction[],
): HistoryPrediction[] {
  const byMarket = new Map<string, HistoryPrediction>();
  for (const row of predictions) {
    const prev = byMarket.get(row.marketId);
    if (!prev || historyRank(row) >= historyRank(prev)) {
      byMarket.set(row.marketId, row);
    }
  }

  const bySlug = new Map<string, HistoryPrediction>();
  for (const row of byMarket.values()) {
    const slugKey = row.slug?.trim().toLowerCase();
    if (!slugKey) {
      bySlug.set(`id:${row.marketId}`, row);
      continue;
    }
    const prev = bySlug.get(slugKey);
    if (!prev || historyRank(row) >= historyRank(prev)) {
      bySlug.set(slugKey, { ...row, id: `pred:${row.marketId}` });
    }
  }

  return [...bySlug.values()];
}

function predictionId(market: Market): string {
  return `pred:${market.id}`;
}

/** Snapshot open model picks so later closed markets can update the history. */
export function recordOpenPredictions(markets: Market[], now = new Date()): number {
  const store = readStore();
  const byId = new Map(store.predictions.map((p) => [p.id, p]));
  let added = 0;

  for (const market of markets) {
    if (market.closed || !market.active) continue;
    if (!market.selectedOutcome) continue;
    // Do not record 98%+ locks — they are not tradable picks.
    if (isOneSidedLock(market)) continue;
    const id = predictionId(market);
    const existing = byId.get(id);
    if (existing?.status === "resolved") continue;

    const next: HistoryPrediction = {
      id,
      marketId: market.id,
      slug: market.slug,
      marketQuestion: market.question,
      side: market.selectedOutcome,
      marketProbability: market.marketProbability ?? null,
      modelProbability: market.modelProbability ?? null,
      edgeScore: market.edgeScore ?? null,
      qualityScore: market.qualityScore ?? null,
      walletConsensusScore: market.walletConsensusScore ?? null,
      recordedAt: existing?.recordedAt ?? now.toISOString(),
      status: "open",
      resolvedAt: null,
      resolvedOutcome: null,
      correct: null,
      source: "live-sync",
    };
    if (!existing) added += 1;
    byId.set(id, next);
  }

  store.predictions = compactHistoryPredictions([...byId.values()]);
  writeStore(store);
  return added;
}

/** Resolve history rows (and create rows) from closed / resolved markets. */
export function resolveClosedPredictions(markets: Market[], now = new Date()): number {
  const store = readStore();
  const byId = new Map(store.predictions.map((p) => [p.id, p]));
  const byMarketId = new Map(store.predictions.map((p) => [p.marketId, p]));
  const bySlug = new Map(
    store.predictions
      .filter((p) => p.slug?.trim())
      .map((p) => [p.slug.trim().toLowerCase(), p]),
  );
  let resolvedCount = 0;

  const upsert = (existing: HistoryPrediction, next: HistoryPrediction) => {
    byId.set(existing.id, next);
    byMarketId.set(next.marketId, next);
    if (next.slug?.trim()) bySlug.set(next.slug.trim().toLowerCase(), next);
    resolvedCount += 1;
  };

  for (const market of markets) {
    if (!market.closed && !market.resolved) continue;
    const resolution = inferMarketResolution({ ...market, closed: true });

    const existing =
      byId.get(predictionId(market)) ??
      byMarketId.get(market.id) ??
      (market.slug ? bySlug.get(market.slug.trim().toLowerCase()) : undefined);
    // Only resolve picks that were recorded while the market was still open.
    // Creating a row from today's post-close favorite makes win-rate ~100%.
    if (!existing?.side || existing.status === "resolved") continue;

    // Closed but outcome names aren't mappable to YES/NO — void out of the
    // open queue so sports/multi-outcome ghosts can't freeze הוכרעו forever.
    if (!resolution.side) {
      const decisive = (market.outcomes ?? []).some((o) => Number(o.price) >= 0.95);
      if (!decisive && !(market.outcomes?.length === 0)) continue;
      upsert(existing, {
        ...existing,
        marketId: existing.marketId || market.id,
        slug: existing.slug || market.slug,
        status: "resolved",
        resolvedAt: now.toISOString(),
        resolvedOutcome: resolution.label || "לא ניתן להכריע",
        correct: null,
        source: "live-sync",
      });
      continue;
    }

    const side = existing.side;
    const correct = side === resolution.side;

    upsert(existing, {
      ...existing,
      marketId: existing.marketId || market.id,
      slug: existing.slug || market.slug,
      side,
      marketProbability: market.marketProbability ?? existing.marketProbability,
      modelProbability: market.modelProbability ?? existing.modelProbability,
      edgeScore: market.edgeScore ?? existing.edgeScore,
      qualityScore: market.qualityScore ?? existing.qualityScore,
      walletConsensusScore:
        market.walletConsensusScore ?? existing.walletConsensusScore,
      status: "resolved",
      resolvedAt: existing.resolvedAt ?? now.toISOString(),
      resolvedOutcome: resolution.label,
      correct,
      source: "live-sync",
    });
  }

  store.predictions = compactHistoryPredictions([...byId.values()]);
  writeStore(store);
  return resolvedCount;
}

/** Mark open rows as void when Gamma no longer returns the market. */
export function voidMissingOpenPredictions(
  preds: Array<{ id: string; marketId: string; slug: string }>,
  now = new Date(),
): number {
  if (!preds.length) return 0;
  const store = readStore();
  const byId = new Map(store.predictions.map((p) => [p.id, p]));
  let voided = 0;
  for (const pred of preds) {
    const existing =
      byId.get(pred.id) ??
      byId.get(`pred:${pred.marketId}`) ??
      store.predictions.find(
        (p) =>
          p.status === "open" &&
          (p.marketId === pred.marketId ||
            (pred.slug && p.slug.toLowerCase() === pred.slug.toLowerCase())),
      );
    if (!existing || existing.status !== "open") continue;
    byId.set(existing.id, {
      ...existing,
      status: "resolved",
      resolvedAt: now.toISOString(),
      resolvedOutcome: "שוק לא נמצא",
      correct: null,
      source: "live-sync",
    });
    voided += 1;
  }
  if (!voided) return 0;
  store.predictions = compactHistoryPredictions([...byId.values()]);
  writeStore(store);
  return voided;
}

export function syncPredictionHistory(active: Market[], closed: Market[]): {
  recorded: number;
  resolved: number;
} {
  const recorded = recordOpenPredictions(active);
  const resolved = resolveClosedPredictions(closed);
  return { recorded, resolved };
}

export function listHistoryPredictions(options?: {
  status?: "open" | "resolved" | "all";
  /** Cap results. Omit or pass 0 / Infinity for the full compacted set. */
  limit?: number;
}): HistoryPrediction[] {
  const store = readStore();
  const status = options?.status ?? "all";
  const limit = options?.limit;
  const rows = compactHistoryPredictions(store.predictions)
    .filter((p) => (status === "all" ? true : p.status === status))
    .sort((a, b) => {
      const aTime = Date.parse(a.resolvedAt ?? a.recordedAt);
      const bTime = Date.parse(b.resolvedAt ?? b.recordedAt);
      return bTime - aTime;
    });
  if (limit == null || !Number.isFinite(limit) || limit <= 0) return rows;
  return rows.slice(0, limit);
}

export function historyWinStats(limit?: number): {
  correct: number | null;
  total: number;
  winRateLabel: string;
  predictions: HistoryPrediction[];
} {
  const predictions = listHistoryPredictions({
    status: "resolved",
    limit: limit ?? 0,
  });
  if (!predictions.length) {
    return {
      correct: null,
      total: 0,
      winRateLabel: "אין מדגם",
      predictions,
    };
  }
  const correct = predictions.filter((p) => p.correct).length;
  return {
    correct,
    total: predictions.length,
    winRateLabel: `${Math.round((correct / predictions.length) * 100)}%`,
    predictions,
  };
}

/** Map marketId → recorded side (open or resolved) for closed-table scoring. */
export function recordedPredictionSides(
  limit?: number,
): Map<string, "YES" | "NO"> {
  const rows = listHistoryPredictions({ status: "all", limit: limit ?? 0 });
  const map = new Map<string, "YES" | "NO">();
  for (const row of rows) {
    if (!map.has(row.marketId)) map.set(row.marketId, row.side);
  }
  return map;
}

/** Build resolved rows from live closed markets when history is still empty. */
export function liveResolvedFromClosed(markets: Market[]): HistoryPrediction[] {
  const now = new Date().toISOString();
  const rows: HistoryPrediction[] = [];
  for (const market of markets) {
    const resolution = inferMarketResolution({ ...market, closed: true });
    if (!market.selectedOutcome || !resolution.side) continue;
    rows.push({
      id: predictionId(market),
      marketId: market.id,
      slug: market.slug,
      marketQuestion: market.question,
      side: market.selectedOutcome,
      marketProbability: market.marketProbability ?? null,
      modelProbability: market.modelProbability ?? null,
      edgeScore: market.edgeScore ?? null,
      qualityScore: market.qualityScore ?? null,
      walletConsensusScore: market.walletConsensusScore ?? null,
      recordedAt: now,
      status: "resolved",
      resolvedAt: market.updatedAt ?? now,
      resolvedOutcome: resolution.label,
      correct: market.selectedOutcome === resolution.side,
      source: "live-sync",
    });
  }
  return rows;
}
