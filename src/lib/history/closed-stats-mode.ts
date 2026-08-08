import type { ClosedStatsOptions } from "@/lib/markets/closed-stats";

/**
 * Real predictions only: never grade with a post-close live re-pick.
 * נסגרו / צדקנו / board count only sides recorded while the market was open.
 */
export function getClosedStatsOptions(): ClosedStatsOptions {
  return { trackedOnly: true, fallbackToLivePick: false };
}
