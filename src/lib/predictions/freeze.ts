import type { HeuristicConfig } from "./config";

export interface FreezeInput {
  hoursToEnd: number | null;
  predictionAgeHours: number | null;
  endDate: string | null;
  now: Date;
  config: HeuristicConfig["freeze"];
}

export function hoursUntil(endDate: string | null | undefined, now = new Date()): number | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) return null;
  return (end - now.getTime()) / (1000 * 60 * 60);
}

export function shouldFreeze(input: FreezeInput): boolean {
  let hoursToEnd = input.hoursToEnd;
  if (hoursToEnd == null && input.endDate) {
    hoursToEnd = hoursUntil(input.endDate, input.now);
  }
  if (hoursToEnd != null && hoursToEnd <= input.config.hours_before_end) return true;
  if (
    input.predictionAgeHours != null &&
    input.predictionAgeHours >= input.config.max_age_hours
  ) {
    return true;
  }
  return false;
}

/** Immutable snapshot payload stored with a prediction. */
export function freezePredictionPayload<T extends Record<string, unknown>>(payload: T): T & {
  frozen_at: string;
} {
  return {
    ...payload,
    frozen_at: new Date().toISOString(),
  };
}
