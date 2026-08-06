import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  getTimeBucket,
  isWithinDisplayHorizon,
  TIME_BUCKET_PRIORITY,
} from "@/lib/predictions/time-buckets";

describe("time buckets", () => {
  const now = new Date("2026-03-22T12:00:00.000Z");

  it("classifies horizons with 2h and 5h emphasis", () => {
    expect(getTimeBucket(new Date(now.getTime() + 30 * 60_000), now)).toBe("within_2h");
    expect(getTimeBucket(new Date(now.getTime() + 5 * 3_600_000), now)).toBe("within_5h");
    expect(getTimeBucket(new Date(now.getTime() + 4 * 3_600_000), now)).toBe("within_5h");
    expect(getTimeBucket(new Date(now.getTime() + 20 * 3_600_000), now)).toBe("within_24h");
    expect(getTimeBucket(new Date(now.getTime() + 2 * 86_400_000), now)).toBe("within_3d");
    expect(getTimeBucket(new Date(now.getTime() + 5 * 86_400_000), now)).toBe("within_7d");
    expect(getTimeBucket(new Date(now.getTime() + 20 * 86_400_000), now)).toBe("within_30d");
    expect(getTimeBucket(new Date(now.getTime() + 40 * 86_400_000), now)).toBe("beyond_30d");
    expect(getTimeBucket(new Date(now.getTime() - 1_000), now)).toBe("closed");
  });

  it("filters display horizon", () => {
    expect(isWithinDisplayHorizon(new Date(now.getTime() + 10 * 86_400_000), now)).toBe(true);
    expect(isWithinDisplayHorizon(new Date(now.getTime() + 40 * 86_400_000), now)).toBe(false);
  });

  it("priority ordering prefers sooner buckets", () => {
    expect(TIME_BUCKET_PRIORITY.within_2h).toBeLessThan(TIME_BUCKET_PRIORITY.within_5h);
    expect(TIME_BUCKET_PRIORITY.within_5h).toBeLessThan(TIME_BUCKET_PRIORITY.within_24h);
    expect(TIME_BUCKET_PRIORITY.within_2h).toBeLessThan(TIME_BUCKET_PRIORITY.within_30d);
  });

  it("formats countdown in Hebrew units", () => {
    expect(formatCountdown(new Date(now.getTime() + 90 * 60_000), now)).toContain("ש");
  });
});
