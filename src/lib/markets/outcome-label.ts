/** Normalize outcome labels for UI — never show raw Over/Under wording. */

const YES_ALIASES = new Set([
  "yes",
  "y",
  "true",
  "up",
  "over",
  "o",
  "higher",
]);
const NO_ALIASES = new Set([
  "no",
  "n",
  "false",
  "down",
  "under",
  "u",
  "lower",
]);

export function normalizeOutcomeSide(
  value?: string | null,
): "YES" | "NO" | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (YES_ALIASES.has(key) || key === "yes") return "YES";
  if (NO_ALIASES.has(key) || key === "no") return "NO";
  if (key.includes("over") && !key.includes("under")) return "YES";
  if (key.includes("under") && !key.includes("over")) return "NO";
  return null;
}

/** Display label for model pick / resolution — Yes/No only, no Over/Under. */
export function formatOutcomeLabel(value?: string | null): string {
  const side = normalizeOutcomeSide(value);
  if (side === "YES") return "Yes";
  if (side === "NO") return "No";
  if (!value) return "—";
  const cleaned = value
    .replace(/\bover\b/gi, "Yes")
    .replace(/\bunder\b/gi, "No")
    .replace(/\bo\/u\b/gi, "")
    .trim();
  return cleaned || "—";
}
