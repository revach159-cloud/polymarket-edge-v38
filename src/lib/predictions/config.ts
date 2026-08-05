import { z } from "zod";

export const heuristicWeightsSchema = z.object({
  price_dislocation: z.number(),
  spread_quality: z.number(),
  volume_momentum: z.number(),
  liquidity_depth: z.number(),
  time_decay: z.number(),
  wallet_consensus: z.number(),
  category_prior: z.number(),
});

export type HeuristicWeights = z.infer<typeof heuristicWeightsSchema>;

export const heuristicThresholdsSchema = z.object({
  min_edge: z.number().default(0.03),
  min_confidence: z.number().default(0.4),
  min_quality: z.number().default(0.55),
  max_spread: z.number().default(0.08),
  min_liquidity: z.number().default(1_000),
  min_volume: z.number().default(500),
  gold_edge: z.number().default(0.05),
  gold_confidence: z.number().default(0.55),
  gold_quality: z.number().default(0.7),
  gold_max_hours: z.number().default(24),
  gold_min_supporting: z.number().default(4),
  gold_min_source_types: z.number().default(3),
});

export type HeuristicThresholds = z.infer<typeof heuristicThresholdsSchema>;

export const freezeConfigSchema = z.object({
  hours_before_end: z.number().default(0.25),
  max_age_hours: z.number().default(24),
});

export const heuristicConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  weights: heuristicWeightsSchema,
  thresholds: heuristicThresholdsSchema,
  freeze: freezeConfigSchema,
  max_horizon_days: z.number().default(30),
});

export type HeuristicConfig = z.infer<typeof heuristicConfigSchema>;

export const HEURISTIC_V1: HeuristicConfig = {
  name: "heuristic-v1",
  version: "1.0.0",
  description:
    "מודל היוריסטי שקוף ראשוני — אינו מודל Machine Learning ואינו מבטיח הצלחה.",
  weights: {
    price_dislocation: 0.18,
    spread_quality: 0.16,
    volume_momentum: 0.12,
    liquidity_depth: 0.16,
    time_decay: 0.14,
    wallet_consensus: 0.14,
    category_prior: 0.1,
  },
  thresholds: {
    min_edge: 0.03,
    min_confidence: 0.4,
    min_quality: 0.55,
    max_spread: 0.08,
    min_liquidity: 1_000,
    min_volume: 500,
    gold_edge: 0.05,
    gold_confidence: 0.55,
    gold_quality: 0.7,
    gold_max_hours: 24,
    gold_min_supporting: 4,
    gold_min_source_types: 3,
  },
  freeze: {
    hours_before_end: 0.25,
    max_age_hours: 24,
  },
  max_horizon_days: 30,
};

export const MODEL_NAME = HEURISTIC_V1.name;
export const MODEL_VERSION = HEURISTIC_V1.version;

export function parseHeuristicConfig(raw: unknown): HeuristicConfig {
  const parsed = heuristicConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : HEURISTIC_V1;
}

export function clampProbability(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
