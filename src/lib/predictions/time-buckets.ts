export type TimeBucket =
  | "within_2h"
  | "within_5h"
  | "within_24h"
  | "within_3d"
  | "within_7d"
  | "within_30d"
  | "beyond_30d"
  | "closed";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function getTimeBucket(closeTime: Date | string, now: Date = new Date()): TimeBucket {
  const close = typeof closeTime === "string" ? new Date(closeTime) : closeTime;
  const ms = close.getTime() - now.getTime();
  if (Number.isNaN(ms)) return "closed";
  if (ms <= 0) return "closed";
  if (ms <= 2 * HOUR) return "within_2h";
  if (ms <= 5 * HOUR) return "within_5h";
  if (ms <= 24 * HOUR) return "within_24h";
  if (ms <= 3 * DAY) return "within_3d";
  if (ms <= 7 * DAY) return "within_7d";
  if (ms <= 30 * DAY) return "within_30d";
  return "beyond_30d";
}

export const TIME_BUCKET_PRIORITY: Record<TimeBucket, number> = {
  within_2h: 0,
  within_5h: 1,
  within_24h: 2,
  within_3d: 3,
  within_7d: 4,
  within_30d: 5,
  beyond_30d: 6,
  closed: 7,
};

export function isWithinDisplayHorizon(closeTime: Date | string, now: Date = new Date()): boolean {
  const bucket = getTimeBucket(closeTime, now);
  return bucket !== "beyond_30d" && bucket !== "closed";
}

export function formatCountdown(closeTime: Date | string, now: Date = new Date()): string {
  const close = typeof closeTime === "string" ? new Date(closeTime) : closeTime;
  const ms = close.getTime() - now.getTime();
  if (ms <= 0) return "נסגר";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}י ${hours}ש`;
  if (hours > 0) return `${hours}ש ${minutes}ד`;
  return `${minutes}ד`;
}

export function hoursUntil(closeTime: Date | string | null | undefined, now = new Date()): number | null {
  if (!closeTime) return null;
  const close = typeof closeTime === "string" ? new Date(closeTime) : closeTime;
  const ms = close.getTime() - now.getTime();
  if (!Number.isFinite(ms)) return null;
  return ms / HOUR;
}

export const hoursUntilClose = hoursUntil;
