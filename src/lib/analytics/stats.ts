export function wilsonLowerBound(successes: number, sampleSize: number, z = 1.96): number {
  if (sampleSize <= 0) return 0;
  const p = successes / sampleSize;
  const z2 = z * z;
  const denominator = 1 + z2 / sampleSize;
  const centre = p + z2 / (2 * sampleSize);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * sampleSize)) / sampleSize);
  return Math.max(0, (centre - margin) / denominator);
}

export function brierScore(forecasts: number[], outcomes: Array<0 | 1>): number | null {
  if (forecasts.length === 0 || forecasts.length !== outcomes.length) return null;
  let sum = 0;
  for (let i = 0; i < forecasts.length; i += 1) {
    const f = clamp01(forecasts[i]!);
    sum += (f - outcomes[i]!) ** 2;
  }
  return sum / forecasts.length;
}

export function logLoss(forecasts: number[], outcomes: Array<0 | 1>): number | null {
  if (forecasts.length === 0 || forecasts.length !== outcomes.length) return null;
  const eps = 1e-15;
  let sum = 0;
  for (let i = 0; i < forecasts.length; i += 1) {
    const f = Math.min(1 - eps, Math.max(eps, forecasts[i]!));
    const o = outcomes[i]!;
    sum += -(o * Math.log(f) + (1 - o) * Math.log(1 - f));
  }
  return sum / forecasts.length;
}

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function calibrationBuckets(
  forecasts: number[],
  outcomes: Array<0 | 1>,
  bucketCount = 10,
): Array<{ bucket: number; avgForecast: number; avgOutcome: number; count: number }> {
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    bucket: i,
    forecastSum: 0,
    outcomeSum: 0,
    count: 0,
  }));
  for (let i = 0; i < forecasts.length; i += 1) {
    const f = clamp01(forecasts[i]!);
    const idx = Math.min(bucketCount - 1, Math.floor(f * bucketCount));
    buckets[idx]!.forecastSum += f;
    buckets[idx]!.outcomeSum += outcomes[i]!;
    buckets[idx]!.count += 1;
  }
  return buckets.map((b) => ({
    bucket: b.bucket,
    avgForecast: b.count ? b.forecastSum / b.count : 0,
    avgOutcome: b.count ? b.outcomeSum / b.count : 0,
    count: b.count,
  }));
}
