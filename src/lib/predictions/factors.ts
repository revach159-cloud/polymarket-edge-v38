import { clampProbability, type HeuristicWeights } from "./config";

export type FactorName = keyof HeuristicWeights;

export interface FactorInput {
  marketProbability: number;
  yesPrice: number | null;
  noPrice: number | null;
  spread: number | null;
  volume: number;
  liquidity: number;
  previousVolume?: number | null;
  hoursToEnd: number | null;
  walletConsensusScore: number | null;
  category: string | null;
  categoryPrior?: number | null;
}

export interface FactorResult {
  factor_name: FactorName;
  factor_value: number;
  weight: number;
  contribution: number;
  explanation: string;
  source_type: string;
}

function priceDislocation(p: number): number {
  return clampProbability(Math.abs(p - 0.5) * 2);
}

function spreadQuality(spread: number | null, maxSpread: number): number {
  if (spread == null || !Number.isFinite(spread)) return 0.4;
  if (spread <= 0) return 1;
  return clampProbability(1 - spread / Math.max(maxSpread, 1e-6));
}

function volumeMomentum(volume: number, previousVolume?: number | null): number {
  if (!previousVolume || previousVolume <= 0) {
    return clampProbability(Math.log10(Math.max(volume, 1)) / 6);
  }
  const ratio = volume / previousVolume;
  return clampProbability(0.5 + Math.tanh(Math.log(ratio)) * 0.5);
}

function liquidityDepth(liquidity: number, minLiquidity: number): number {
  return clampProbability(
    Math.log10(Math.max(liquidity, 1) + 1) / Math.log10(minLiquidity * 20 + 1),
  );
}

function timeDecay(hoursToEnd: number | null): number {
  if (hoursToEnd == null || hoursToEnd < 0) return 0.5;
  if (hoursToEnd < 2) return 0.85;
  if (hoursToEnd < 24) return 0.9;
  if (hoursToEnd < 168) return 0.75;
  if (hoursToEnd < 720) return 0.55;
  return 0.35;
}

export function computeFactors(
  input: FactorInput,
  weights: HeuristicWeights,
  options?: { maxSpread?: number; minLiquidity?: number },
): FactorResult[] {
  const maxSpread = options?.maxSpread ?? 0.08;
  const minLiquidity = options?.minLiquidity ?? 500;

  const values: Record<FactorName, { value: number; explanation: string; source: string }> = {
    price_dislocation: {
      value: priceDislocation(input.marketProbability),
      explanation: "מרחק המחיר מ־50% כאינדיקציית הזדמנות/אי־ודאות.",
      source: "clob",
    },
    spread_quality: {
      value: spreadQuality(input.spread, maxSpread),
      explanation: "איכות מרווח bid/ask.",
      source: "clob",
    },
    volume_momentum: {
      value: volumeMomentum(input.volume, input.previousVolume),
      explanation: "מומנטום נפח מסחר ציבורי.",
      source: "gamma",
    },
    liquidity_depth: {
      value: liquidityDepth(input.liquidity, minLiquidity),
      explanation: "עומק נזילות יחסי.",
      source: "clob",
    },
    time_decay: {
      value: timeDecay(input.hoursToEnd),
      explanation: "התאמת ציון לפי אופק הזמן לסגירה.",
      source: "market_metadata",
    },
    wallet_consensus: {
      value: input.walletConsensusScore == null ? 0.5 : clampProbability(input.walletConsensusScore),
      explanation: "קונצנזוס ארנקים איכותיים (ציבורי).",
      source: "data_api",
    },
    category_prior: {
      value: input.categoryPrior == null ? 0.5 : clampProbability(input.categoryPrior),
      explanation: "אמינות קטגוריה היסטורית כאשר זמינה.",
      source: "system",
    },
  };

  return (Object.keys(weights) as FactorName[]).map((name) => {
    const v = values[name];
    const weight = weights[name];
    return {
      factor_name: name,
      factor_value: v.value,
      weight,
      contribution: v.value * weight,
      explanation: v.explanation,
      source_type: v.source,
    };
  });
}
