export type DataFreshness = "fresh" | "delayed" | "stale" | "unavailable";

export function classifyFreshness(
  capturedAt: Date | string | null | undefined,
  now: Date = new Date(),
  thresholds: { freshMs?: number; delayedMs?: number; staleMs?: number } = {},
): DataFreshness {
  if (!capturedAt) return "unavailable";
  const at = typeof capturedAt === "string" ? new Date(capturedAt) : capturedAt;
  if (Number.isNaN(at.getTime())) return "unavailable";
  const age = now.getTime() - at.getTime();
  if (age < 0) return "fresh";
  const freshMs = thresholds.freshMs ?? 2 * 60_000;
  const delayedMs = thresholds.delayedMs ?? 15 * 60_000;
  const staleMs = thresholds.staleMs ?? 60 * 60_000;
  if (age <= freshMs) return "fresh";
  if (age <= delayedMs) return "delayed";
  if (age <= staleMs) return "stale";
  return "stale";
}

export function freshnessLabelHe(status: DataFreshness): string {
  switch (status) {
    case "fresh":
      return "עדכני";
    case "delayed":
      return "מעוכב";
    case "stale":
      return "ישן";
    case "unavailable":
      return "לא זמין";
  }
}
