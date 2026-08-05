import { HEURISTIC_V1, clampProbability, type HeuristicConfig } from "./config";
import { computeFactors, type FactorInput } from "./factors";
import { computeEdge, type EdgeResult } from "./edge";
import { computeQuality, qualityToScore100 } from "./quality";
import { isGoldCandidate } from "./gold";
import { passesFilters } from "./filter";
import { shouldFreeze } from "./freeze";
import { getTimeBucket } from "./time-buckets";
import { classifyFreshness, type DataFreshness } from "./freshness";

export interface ScoringInput extends FactorInput {
  endDate?: string | null;
  lastSyncedAt?: string | null;
  now?: Date;
  freshness?: DataFreshness;
  hasConflict?: boolean;
  resolutionUnclear?: boolean;
}

export interface ScoringResult {
  side: "yes" | "no";
  fair_probability: number;
  market_probability: number;
  edge: number;
  confidence: number;
  quality_score: number;
  quality_score_100: number;
  is_gold: boolean;
  is_frozen: boolean;
  should_emit: boolean;
  time_bucket: string;
  factors: ReturnType<typeof computeFactors>;
  edge_detail: EdgeResult;
  reject_reasons: string[];
  freshness: DataFreshness;
  model_name: string;
  model_version: string;
}

function estimateFairProbability(
  marketP: number,
  factors: ReturnType<typeof computeFactors>,
): { fair: number; confidence: number } {
  const weightSum = factors.reduce((s, f) => s + Math.abs(f.weight), 0) || 1;
  const score = factors.reduce((s, f) => s + f.contribution, 0) / weightSum;
  const dislocation =
    factors.find((f) => f.factor_name === "price_dislocation")?.factor_value ?? 0;
  const consensus =
    factors.find((f) => f.factor_name === "wallet_consensus")?.factor_value ?? 0.5;
  const lean = (consensus - 0.5) * 2;
  const adjustment = (score - 0.5) * 0.2 + lean * dislocation * 0.08;
  const fair = clampProbability(marketP + adjustment);
  const confidence = clampProbability(
    0.35 +
      (factors.find((f) => f.factor_name === "spread_quality")?.factor_value ?? 0) * 0.25 +
      (factors.find((f) => f.factor_name === "liquidity_depth")?.factor_value ?? 0) * 0.2 +
      dislocation * 0.2,
  );
  return { fair, confidence };
}

export function scoreMarket(
  input: ScoringInput,
  config: HeuristicConfig = HEURISTIC_V1,
): ScoringResult {
  const now = input.now ?? new Date();
  const marketP = clampProbability(input.marketProbability);
  const factors = computeFactors(input, config.weights, {
    maxSpread: config.thresholds.max_spread,
    minLiquidity: config.thresholds.min_liquidity,
  });
  const { fair, confidence } = estimateFairProbability(marketP, factors);
  const edgeDetail = computeEdge(fair, marketP);
  const quality = computeQuality({
    factors,
    confidence,
    spread: input.spread,
    liquidity: input.liquidity,
    volume: input.volume,
    thresholds: config.thresholds,
  });
  const freshness =
    input.freshness ?? classifyFreshness(input.lastSyncedAt ?? now.toISOString(), now);

  const frozen = shouldFreeze({
    hoursToEnd: input.hoursToEnd,
    predictionAgeHours: null,
    endDate: input.endDate ?? null,
    now,
    config: config.freeze,
  });

  const filter = passesFilters({
    edge: edgeDetail.edge,
    confidence,
    quality,
    spread: input.spread,
    liquidity: input.liquidity,
    volume: input.volume,
    thresholds: config.thresholds,
  });

  const gold = isGoldCandidate({
    edge: edgeDetail.edge,
    confidence,
    quality,
    hoursToEnd: input.hoursToEnd,
    factors,
    freshness,
    thresholds: config.thresholds,
    hasConflict: input.hasConflict,
    resolutionUnclear: input.resolutionUnclear,
  });

  const closeIso =
    input.endDate ??
    (input.hoursToEnd != null
      ? new Date(now.getTime() + input.hoursToEnd * 3600_000).toISOString()
      : now.toISOString());

  return {
    side: edgeDetail.side,
    fair_probability: fair,
    market_probability: marketP,
    edge: edgeDetail.edge,
    confidence,
    quality_score: quality,
    quality_score_100: qualityToScore100(quality),
    is_gold: gold && filter.ok,
    is_frozen: frozen,
    should_emit: filter.ok && !frozen,
    time_bucket: getTimeBucket(closeIso, now),
    factors,
    edge_detail: edgeDetail,
    reject_reasons: filter.reasons,
    freshness,
    model_name: config.name,
    model_version: config.version,
  };
}
