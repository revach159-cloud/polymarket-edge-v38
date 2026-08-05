import type { HeuristicThresholds } from "./config";
import { clampProbability } from "./config";
import type { FactorResult } from "./factors";

export interface QualityInput {
  factors: FactorResult[];
  confidence: number;
  spread: number | null;
  liquidity: number;
  volume: number;
  thresholds: HeuristicThresholds;
}

/** Returns quality in 0–1 (display as score/100). */
export function computeQuality(input: QualityInput): number {
  const spreadScore =
    input.spread == null
      ? 0.5
      : clampProbability(1 - input.spread / Math.max(input.thresholds.max_spread, 1e-6));

  const liquidityScore = clampProbability(
    input.liquidity / Math.max(input.thresholds.min_liquidity * 5, 1),
  );
  const volumeScore = clampProbability(
    input.volume / Math.max(input.thresholds.min_volume * 5, 1),
  );

  const factorStability =
    input.factors.length === 0
      ? 0.5
      : clampProbability(
          1 - standardDeviation(input.factors.map((f) => f.factor_value)) * 1.5,
        );

  return clampProbability(
    input.confidence * 0.35 +
      spreadScore * 0.2 +
      liquidityScore * 0.2 +
      volumeScore * 0.15 +
      factorStability * 0.1,
  );
}

export function qualityToScore100(quality01: number): number {
  return Math.round(clampProbability(quality01) * 1000) / 10;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
