import { listHistoryPredictions } from "@/lib/history/prediction-store";
import type { ClosedStatsOptions } from "@/lib/markets/closed-stats";

/**
 * Prefer honest tracked history when we have graded rows.
 * Otherwise bypass the empty-sample freeze: score live closed markets so
 * נסגרו / צדקנו / the board stay populated and in sync (no Supabase required).
 */
export function getClosedStatsOptions(): ClosedStatsOptions {
  const graded = listHistoryPredictions({ status: "resolved", limit: 0 }).filter(
    (row) => row.correct != null,
  );
  if (graded.length > 0) {
    return { trackedOnly: true, fallbackToLivePick: false };
  }
  return { trackedOnly: false, fallbackToLivePick: true };
}

export function hasGradedHistorySample(): boolean {
  return (
    listHistoryPredictions({ status: "resolved", limit: 0 }).filter(
      (row) => row.correct != null,
    ).length > 0
  );
}
