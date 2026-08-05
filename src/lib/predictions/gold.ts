import type { HeuristicThresholds } from "./config";
import type { FactorResult } from "./factors";
import type { DataFreshness } from "./freshness";

export interface GoldInput {
  edge: number;
  confidence: number;
  quality: number;
  hoursToEnd: number | null;
  factors: FactorResult[];
  freshness: DataFreshness;
  thresholds: HeuristicThresholds;
  hasConflict?: boolean;
  resolutionUnclear?: boolean;
}

export function isGoldCandidate(input: GoldInput): boolean {
  const t = input.thresholds;
  if (input.hasConflict || input.resolutionUnclear) return false;
  if (input.freshness === "stale" || input.freshness === "unavailable") return false;
  if (input.hoursToEnd == null || input.hoursToEnd > t.gold_max_hours) return false;
  if (input.edge < t.gold_edge) return false;
  if (input.confidence < t.gold_confidence) return false;
  if (input.quality < t.gold_quality) return false;

  const supporting = input.factors.filter((f) => f.factor_value >= 0.65);
  if (supporting.length < t.gold_min_supporting) return false;
  const sources = new Set(supporting.map((f) => f.source_type));
  if (sources.size < t.gold_min_source_types) return false;
  return true;
}

export const GOLD_EMPTY_MESSAGE =
  "אין כרגע בחירות שעברו את רף Gold. המערכת אינה מורידה את דרישות האיכות כדי למלא את הרשימה.";

/** Alias for enrich / UI layers. */
export function isGoldEligible(input: GoldInput): boolean {
  return isGoldCandidate(input);
}
