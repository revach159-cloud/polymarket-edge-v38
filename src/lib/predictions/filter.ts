import type { HeuristicThresholds } from "./config";
import {
  getTimeBucket,
  isWithinDisplayHorizon,
  TIME_BUCKET_PRIORITY,
  type TimeBucket,
} from "./time-buckets";

export interface FilterInput {
  edge: number;
  confidence: number;
  quality: number;
  spread: number | null;
  liquidity: number;
  volume: number;
  thresholds: HeuristicThresholds;
}

export interface FilterResult {
  ok: boolean;
  reasons: string[];
}

export function passesFilters(input: FilterInput): FilterResult {
  const reasons: string[] = [];
  const t = input.thresholds;

  if (input.edge < t.min_edge) reasons.push("edge_below_min");
  if (input.confidence < t.min_confidence) reasons.push("confidence_below_min");
  if (input.quality < t.min_quality) reasons.push("quality_below_min");
  if (input.spread != null && input.spread > t.max_spread) reasons.push("spread_too_wide");
  if (input.liquidity < t.min_liquidity) reasons.push("liquidity_too_low");
  if (input.volume < t.min_volume) reasons.push("volume_too_low");

  return { ok: reasons.length === 0, reasons };
}

export interface RankableMarket {
  id: string;
  eventId?: string | null;
  closeTime: string;
  qualityScore?: number | null;
  liquidity?: number | null;
  volume?: number | null;
  spread?: number | null;
  closed?: boolean;
  active?: boolean;
}

export function filterDisplayMarkets<T extends RankableMarket>(
  markets: T[],
  now = new Date(),
): T[] {
  return markets.filter((m) => {
    if (m.closed) return false;
    if (m.active === false) return false;
    return isWithinDisplayHorizon(m.closeTime, now);
  });
}

export function sortMarkets<T extends RankableMarket>(markets: T[], now = new Date()): T[] {
  return [...markets].sort((a, b) => {
    const ba = TIME_BUCKET_PRIORITY[getTimeBucket(a.closeTime, now) as TimeBucket];
    const bb = TIME_BUCKET_PRIORITY[getTimeBucket(b.closeTime, now) as TimeBucket];
    if (ba !== bb) return ba - bb;
    return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
  });
}

export function dedupeByEvent<T extends RankableMarket>(markets: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const m of markets) {
    const key = m.eventId || m.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}
