/**
 * Prediction-layer statistics (Wilson, Brier, log-loss, calibration).
 * Also re-exported from analytics/stats for shared use.
 */

export function wilsonLowerBound(
  successes: number,
  trials: number,
  z = 1.96,
): number {
  if (trials <= 0) return 0;
  const p = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const centre = p + z2 / (2 * trials);
  const margin =
    z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);
  return Math.max(0, (centre - margin) / denominator);
}

export function wilsonInterval(
  successes: number,
  trials: number,
  z = 1.96,
): { lower: number; upper: number; centre: number } {
  if (trials <= 0) {
    return { lower: 0, upper: 1, centre: 0.5 };
  }
  const p = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const centre = (p + z2 / (2 * trials)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials)) / denominator;
  return {
    lower: Math.max(0, centre - margin),
    upper: Math.min(1, centre + margin),
    centre,
  };
}

export function brierScore(
  predictions: Array<{ probability: number; outcome: 0 | 1 }>,
): number {
  if (predictions.length === 0) return 0;
  const sum = predictions.reduce((acc, row) => {
    const p = Math.min(1, Math.max(0, row.probability));
    return acc + (p - row.outcome) ** 2;
  }, 0);
  return sum / predictions.length;
}

export function logLoss(
  predictions: Array<{ probability: number; outcome: 0 | 1 }>,
  epsilon = 1e-15,
): number {
  if (predictions.length === 0) return 0;
  const sum = predictions.reduce((acc, row) => {
    const p = Math.min(1 - epsilon, Math.max(epsilon, row.probability));
    return acc - (row.outcome === 1 ? Math.log(p) : Math.log(1 - p));
  }, 0);
  return sum / predictions.length;
}

export interface CalibrationBin {
  bin: number;
  lower: number;
  upper: number;
  count: number;
  avgPredicted: number;
  avgActual: number;
  gap: number;
}

export function calibrationCurve(
  predictions: Array<{ probability: number; outcome: 0 | 1 }>,
  bins = 10,
): CalibrationBin[] {
  const result: CalibrationBin[] = [];
  for (let i = 0; i < bins; i++) {
    const lower = i / bins;
    const upper = (i + 1) / bins;
    const inBin = predictions.filter((p) => {
      const x = p.probability;
      return i === bins - 1
        ? x >= lower && x <= upper
        : x >= lower && x < upper;
    });
    const count = inBin.length;
    const avgPredicted =
      count === 0
        ? (lower + upper) / 2
        : inBin.reduce((s, r) => s + r.probability, 0) / count;
    const avgActual =
      count === 0
        ? 0
        : inBin.reduce((s, r) => s + r.outcome, 0) / count;
    result.push({
      bin: i,
      lower,
      upper,
      count,
      avgPredicted,
      avgActual,
      gap: avgPredicted - avgActual,
    });
  }
  return result;
}

export function expectedCalibrationError(
  predictions: Array<{ probability: number; outcome: 0 | 1 }>,
  bins = 10,
): number {
  if (predictions.length === 0) return 0;
  const curve = calibrationCurve(predictions, bins);
  return curve.reduce(
    (acc, b) => acc + (b.count / predictions.length) * Math.abs(b.gap),
    0,
  );
}
