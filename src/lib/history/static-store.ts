import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  HISTORY_STORE_VERSION,
  getHistoryStoreSnapshot,
  importHistoryPredictions,
  type HistoryPrediction,
  type HistoryStoreShape,
} from "@/lib/history/prediction-store";

const STATIC_RELATIVE = path.join("public", "prediction-history.json");

type StaticPayload = {
  version: number;
  updatedAt?: string;
  predictions: HistoryPrediction[];
};

function parsePayload(raw: unknown): StaticPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (row.version !== HISTORY_STORE_VERSION) return null;
  if (!Array.isArray(row.predictions)) return null;
  return {
    version: HISTORY_STORE_VERSION,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    predictions: row.predictions as HistoryPrediction[],
  };
}

function readBundledFile(): StaticPayload | null {
  const candidates = [
    path.join(process.cwd(), STATIC_RELATIVE),
    path.join(process.cwd(), "prediction-history.json"),
  ];
  for (const file of candidates) {
    try {
      if (!existsSync(file)) continue;
      return parsePayload(JSON.parse(readFileSync(file, "utf8")));
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Hydrate from the committed public/prediction-history.json (no Supabase).
 * Survives Vercel cold starts because it ships with the deployment.
 */
export async function hydratePredictionHistoryFromStatic(): Promise<{
  loaded: number;
  ok: boolean;
  source: "bundle" | "url" | "none";
}> {
  const bundled = readBundledFile();
  if (bundled?.predictions.length) {
    const loaded = importHistoryPredictions(bundled.predictions);
    return { loaded, ok: true, source: "bundle" };
  }

  // Also try the live deployment URL / GitHub raw (works even if bundle path differs).
  const urls = [
    process.env.PREDICTION_HISTORY_URL,
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/prediction-history.json`
      : null,
    "https://polymarket-daily-edge.vercel.app/prediction-history.json",
  ].filter(Boolean) as string[];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const payload = parsePayload(await res.json());
      if (!payload?.predictions.length) continue;
      const loaded = importHistoryPredictions(payload.predictions);
      return { loaded, ok: true, source: "url" };
    } catch {
      // try next
    }
  }

  return { loaded: 0, ok: false, source: "none" };
}

/** Snapshot shape for scripts / Actions that rewrite the static file. */
export function staticHistoryPayload(): HistoryStoreShape {
  return getHistoryStoreSnapshot();
}
