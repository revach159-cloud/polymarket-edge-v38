import "server-only";

import type { Json } from "@/lib/database/types";
import { tryCreateAdminClient } from "@/lib/auth/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/env";
import { HEURISTIC_V1 } from "@/lib/predictions/config";
import { getTimeBucket } from "@/lib/predictions/time-buckets";
import {
  recordOpenPredictions,
  resolveClosedPredictions,
} from "@/lib/history/prediction-store";
import {
  ensurePredictionHistoryReady,
  persistPredictionHistory,
} from "@/lib/history/ensure-history";
import type { Market } from "@/types";

export type PersistChampionResult = {
  recordedLocal: number;
  resolvedLocal: number;
  upsertedDb: number;
  marketsLinked: number;
  durableSaved: number;
  message: string;
};

/**
 * Persist champion picks so closed history / win-rate stay honest.
 * Always writes the local history store; also upserts Supabase when service role exists.
 */
export async function persistChampionPredictions(
  active: Market[],
  closed: Market[] = [],
  now = new Date(),
): Promise<PersistChampionResult> {
  await ensurePredictionHistoryReady();
  const recordedLocal = recordOpenPredictions(active, now);
  const resolvedLocal = resolveClosedPredictions(closed, now);
  const durableSaved = await persistPredictionHistory();

  if (!isServiceRoleConfigured()) {
    return {
      recordedLocal,
      resolvedLocal,
      upsertedDb: 0,
      marketsLinked: 0,
      durableSaved: 0,
      message:
        "Local history updated — configure SUPABASE_SERVICE_ROLE_KEY to persist history + predictions",
    };
  }

  const admin = tryCreateAdminClient();
  if (!admin) {
    return {
      recordedLocal,
      resolvedLocal,
      upsertedDb: 0,
      marketsLinked: 0,
      durableSaved,
      message: "Admin client unavailable — durable history only",
    };
  }

  // Ensure markets rows exist for FK (polymarket_id → uuid).
  const idMap = new Map<string, string>();
  let marketsLinked = 0;
  for (const market of active) {
    if (!market.selectedOutcome) continue;
    const yes =
      market.outcomes.find((o) => o.name.toLowerCase() === "yes")?.price ??
      market.marketProbability ??
      null;
    const no =
      market.outcomes.find((o) => o.name.toLowerCase() === "no")?.price ??
      (yes != null ? 1 - yes : null);
    const { data, error } = await admin
      .from("markets")
      .upsert(
        {
          polymarket_id: market.id,
          slug: market.slug,
          question: market.question,
          description: market.description ?? null,
          category: market.category ?? null,
          status: market.closed ? "closed" : "active",
          yes_price: yes,
          no_price: no,
          volume: market.volume,
          liquidity: market.liquidity,
          end_date: market.endDate,
          clob_token_ids: market.clobTokenIds ?? [],
          last_synced_at: now.toISOString(),
        },
        { onConflict: "polymarket_id" },
      )
      .select("id, polymarket_id")
      .maybeSingle();
    if (!error && data?.id) {
      idMap.set(String(data.polymarket_id ?? market.id), data.id);
      marketsLinked += 1;
    }
  }

  // Resolve model_version id (create soft stub configuration if missing).
  let modelVersionId: string | null = null;
  try {
    const { data: existing } = await admin
      .from("model_versions")
      .select("id")
      .eq("name", HEURISTIC_V1.name)
      .eq("version", HEURISTIC_V1.version)
      .maybeSingle();
    if (existing?.id) {
      modelVersionId = existing.id;
    } else {
      const { data: created } = await admin
        .from("model_versions")
        .insert({
          name: HEURISTIC_V1.name,
          version: HEURISTIC_V1.version,
          is_active: true,
          configuration: HEURISTIC_V1 as unknown as Json,
        })
        .select("id")
        .maybeSingle();
      modelVersionId = created?.id ?? null;
    }
  } catch {
    modelVersionId = null;
  }

  if (!modelVersionId) {
    return {
      recordedLocal,
      resolvedLocal,
      upsertedDb: 0,
      marketsLinked,
      durableSaved,
      message: "model_versions unavailable — durable history saved",
    };
  }

  // Expire prior active champion rows for these markets (best-effort).
  try {
    await admin
      .from("predictions")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("status", "active")
      .eq("model_version_id", modelVersionId);
  } catch {
    // table / RLS may differ in older envs
  }

  let upsertedDb = 0;
  for (const market of active) {
    if (!market.selectedOutcome) continue;
    const marketUuid = idMap.get(market.id);
    if (!marketUuid) continue;
    const side = market.selectedOutcome === "YES" ? "yes" : "no";
    const fair = market.modelProbability ?? market.marketProbability ?? 0.5;
    const marketP = market.marketProbability ?? 0.5;
    const edge = Math.abs(market.edgeScore ?? fair - marketP);
    const confidence = Math.min(0.95, Math.max(0.05, 0.45 + edge));
    const quality =
      market.qualityScore != null ? market.qualityScore / 100 : null;

    const { error } = await admin.from("predictions").insert({
      market_id: marketUuid,
      model_version_id: modelVersionId,
      side,
      fair_probability: fair,
      market_probability: marketP,
      edge,
      confidence,
      quality_score: quality,
      is_gold: Boolean(market.goldPick),
      is_frozen: false,
      status: "active",
      time_bucket: market.endDate
        ? getTimeBucket(market.endDate, now)
        : null,
      metadata: {
        role: "champion",
        predictionScore: market.qualityScore ?? null,
        slug: market.slug,
        polymarket_id: market.id,
      },
    });
    if (!error) upsertedDb += 1;
  }

  return {
    recordedLocal,
    resolvedLocal,
    upsertedDb,
    marketsLinked,
    durableSaved,
    message: `Local +${recordedLocal}/resolved ${resolvedLocal}; durable ${durableSaved}; DB inserted ${upsertedDb}`,
  };
}
