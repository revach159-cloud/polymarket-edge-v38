import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  importHistoryPredictions,
  type HistoryPrediction,
} from "@/lib/history/prediction-store";

/**
 * Public-read fallback: rebuild tracked history from Supabase `predictions`
 * when the ephemeral /tmp store is empty (no service-role required for SELECT).
 */
export async function hydratePredictionHistoryFromDb(): Promise<{
  loaded: number;
  ok: boolean;
}> {
  if (!isSupabaseConfigured()) return { loaded: 0, ok: false };

  try {
    const supabase = await createClient();
    if (!supabase) return { loaded: 0, ok: false };

    const { data, error } = await supabase
      .from("predictions")
      .select(
        "id, side, status, resolved_correct, resolved_at, created_at, market_probability, fair_probability, edge, quality_score, metadata, markets(question, slug, polymarket_id)",
      )
      .or("status.eq.active,resolved_correct.not.is.null")
      .order("created_at", { ascending: false })
      .limit(3_000);

    if (error || !data?.length) return { loaded: 0, ok: !error };

    const rows: HistoryPrediction[] = [];
    for (const row of data) {
      const market = Array.isArray(row.markets) ? row.markets[0] : row.markets;
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const polymarketId =
        (typeof meta.polymarket_id === "string" && meta.polymarket_id) ||
        market?.polymarket_id ||
        null;
      const slug =
        (typeof meta.slug === "string" && meta.slug) || market?.slug || null;
      if (!polymarketId || !slug) continue;

      const side = row.side === "yes" ? "YES" : row.side === "no" ? "NO" : null;
      if (!side) continue;

      const resolved =
        row.resolved_correct != null || row.status === "resolved";
      rows.push({
        id: `pred:${polymarketId}`,
        marketId: String(polymarketId),
        slug: String(slug),
        marketQuestion: market?.question ?? "שוק",
        side,
        marketProbability:
          row.market_probability != null ? Number(row.market_probability) : null,
        modelProbability:
          row.fair_probability != null ? Number(row.fair_probability) : null,
        edgeScore: row.edge != null ? Number(row.edge) : null,
        qualityScore:
          row.quality_score != null ? Number(row.quality_score) * 100 : null,
        walletConsensusScore: null,
        recordedAt: row.created_at ?? new Date().toISOString(),
        status: resolved ? "resolved" : "open",
        resolvedAt: row.resolved_at ?? null,
        resolvedOutcome: null,
        correct:
          row.resolved_correct == null ? null : Boolean(row.resolved_correct),
        source: "live-sync",
      });
    }

    const loaded = importHistoryPredictions(rows);
    return { loaded, ok: true };
  } catch {
    return { loaded: 0, ok: false };
  }
}
