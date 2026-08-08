import "server-only";

import { tryCreateAdminClient } from "@/lib/auth/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/env";
import type { Json } from "@/lib/database/types";
import {
  HISTORY_STORE_VERSION,
  getHistoryStoreSnapshot,
  importHistoryPredictions,
  type HistoryPrediction,
  type HistoryStoreShape,
} from "@/lib/history/prediction-store";

/** Survives Vercel /tmp wipes — one row in system_health.metadata. */
const DURABLE_SERVICE = "prediction-history-store";

type DurablePayload = {
  version: number;
  updatedAt: string;
  predictions: HistoryPrediction[];
};

function asPayload(meta: unknown): DurablePayload | null {
  if (!meta || typeof meta !== "object") return null;
  const row = meta as Record<string, unknown>;
  if (row.version !== HISTORY_STORE_VERSION) return null;
  if (!Array.isArray(row.predictions)) return null;
  return {
    version: HISTORY_STORE_VERSION,
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : new Date().toISOString(),
    predictions: row.predictions as HistoryPrediction[],
  };
}

/** Pull durable history into the local/memory store (merge, prefer resolved). */
export async function hydratePredictionHistoryFromDurable(): Promise<{
  loaded: number;
  ok: boolean;
}> {
  if (!isServiceRoleConfigured()) {
    return { loaded: 0, ok: false };
  }
  const admin = tryCreateAdminClient();
  if (!admin) return { loaded: 0, ok: false };

  try {
    const { data, error } = await admin
      .from("system_health")
      .select("metadata")
      .eq("service_name", DURABLE_SERVICE)
      .maybeSingle();
    if (error || !data) return { loaded: 0, ok: !error };

    const payload = asPayload(data.metadata);
    if (!payload?.predictions.length) return { loaded: 0, ok: true };

    const merged = importHistoryPredictions(payload.predictions);
    return { loaded: merged, ok: true };
  } catch {
    return { loaded: 0, ok: false };
  }
}

/** Persist current local history so נסגרו/צדקנו survive deploys. */
export async function flushPredictionHistoryToDurable(): Promise<{
  saved: number;
  ok: boolean;
}> {
  if (!isServiceRoleConfigured()) {
    return { saved: 0, ok: false };
  }
  const admin = tryCreateAdminClient();
  if (!admin) return { saved: 0, ok: false };

  const snapshot: HistoryStoreShape = getHistoryStoreSnapshot();
  const metadata: DurablePayload = {
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    predictions: snapshot.predictions,
  };

  try {
    const { error } = await admin.from("system_health").upsert(
      {
        service_name: DURABLE_SERVICE,
        status: "healthy",
        last_success_at: new Date().toISOString(),
        last_run_at: new Date().toISOString(),
        metadata: metadata as unknown as Json,
      },
      { onConflict: "service_name" },
    );
    if (error) return { saved: 0, ok: false };
    return { saved: snapshot.predictions.length, ok: true };
  } catch {
    return { saved: 0, ok: false };
  }
}

/**
 * Hydrate → run work → flush. Use around any path that mutates history.
 */
export async function withDurablePredictionHistory<T>(
  work: () => Promise<T> | T,
): Promise<T> {
  await hydratePredictionHistoryFromDurable();
  try {
    return await work();
  } finally {
    await flushPredictionHistoryToDurable();
  }
}
