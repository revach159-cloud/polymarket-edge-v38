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

/** Bump to wipe inflated / post-close-graded history and restart honest tracking. */
const STORE_VERSION = 2 as const;

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
    // Reset any pre-v2 history — those rows inflated win-rate with post-close picks.
    if (!parsed || parsed.version !== STORE_VERSION) {
      writeStore(emptyStore());
      return memoryStore();
    }
    if (!parsed.predictions || !Array.isArray(parsed.predictions)) return mem;
    mem.predictions = parsed.predictions;
    mem.updatedAt = parsed.updatedAt ?? mem.updatedAt;
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
    writeFileSync(file, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Filesystem may be read-only in some runtimes; memory still works for the process.
  }
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

  store.predictions = [...byId.values()];
  writeStore(store);
  return added;
}

/** Resolve history rows (and create rows) from closed / resolved markets. */
export function resolveClosedPredictions(markets: Market[], now = new Date()): number {
  const store = readStore();
  const byId = new Map(store.predictions.map((p) => [p.id, p]));
  let resolvedCount = 0;

  for (const market of markets) {
    if (!market.closed && !market.resolved) continue;
    const resolution = inferMarketResolution({ ...market, closed: true });
    if (!resolution.side) continue;

    const id = predictionId(market);
    const existing = byId.get(id);
    // Only resolve picks that were recorded while the market was still open.
    // Creating a row from today's post-close favorite makes win-rate ~100%.
    if (!existing?.side) continue;
    const side = existing.side;

    const correct = side === resolution.side;
    if (existing.status === "resolved" && existing.correct === correct) continue;

    byId.set(id, {
      ...existing,
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
    resolvedCount += 1;
  }

  store.predictions = [...byId.values()];
  writeStore(store);
  return resolvedCount;
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
  limit?: number;
}): HistoryPrediction[] {
  const store = readStore();
  const status = options?.status ?? "all";
  const limit = options?.limit ?? 100;
  return store.predictions
    .filter((p) => (status === "all" ? true : p.status === status))
    .sort((a, b) => {
      const aTime = Date.parse(a.resolvedAt ?? a.recordedAt);
      const bTime = Date.parse(b.resolvedAt ?? b.recordedAt);
      return bTime - aTime;
    })
    .slice(0, limit);
}

export function historyWinStats(limit = 1_000): {
  correct: number | null;
  total: number;
  winRateLabel: string;
  predictions: HistoryPrediction[];
} {
  const predictions = listHistoryPredictions({ status: "resolved", limit });
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
  limit = 5_000,
): Map<string, "YES" | "NO"> {
  const rows = listHistoryPredictions({ status: "all", limit });
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
