import "server-only";

import {
  flushPredictionHistoryToDurable,
  hydratePredictionHistoryFromDurable,
} from "@/lib/history/durable-store";
import { hydratePredictionHistoryFromDb } from "@/lib/history/hydrate-from-db";
import { getHistoryStoreSnapshot } from "@/lib/history/prediction-store";

/**
 * Make sure tracked history is warm before sync/resolve.
 * 1) Durable blob in system_health (service role)
 * 2) Fallback: public predictions rows (anon read)
 */
export async function ensurePredictionHistoryReady(): Promise<{
  fromDurable: number;
  fromDb: number;
}> {
  const durable = await hydratePredictionHistoryFromDurable();
  let fromDb = 0;
  if (getHistoryStoreSnapshot().predictions.length === 0) {
    const db = await hydratePredictionHistoryFromDb();
    fromDb = db.loaded;
  }
  return { fromDurable: durable.loaded, fromDb };
}

export async function persistPredictionHistory(): Promise<number> {
  const flushed = await flushPredictionHistoryToDurable();
  return flushed.saved;
}
