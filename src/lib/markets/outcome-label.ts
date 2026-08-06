/** Concrete prediction labels — never show bare Yes/No when a real outcome exists. */

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

export function isGenericYesNoLabel(value?: string | null): boolean {
  if (!value) return true;
  const key = value.trim().toLowerCase();
  return (
    key === "yes" ||
    key === "no" ||
    key === "y" ||
    key === "n" ||
    key === "true" ||
    key === "false"
  );
}

/** Sports moneyline rows carry the real pick name in groupItemTitle (team / Draw). */
export function isSportsMoneylineMarket(market: {
  sportsMarketType?: string | null;
  groupItemTitle?: string | null;
}): boolean {
  const type = market.sportsMarketType?.toLowerCase();
  if (type === "moneyline") return true;
  return Boolean(market.groupItemTitle?.trim());
}

export function cleanGroupItemTitle(title: string): string {
  const trimmed = title.trim();
  if (/^draw\b/i.test(trimmed)) return "Draw";
  return trimmed;
}

/**
 * Pull the subject from "Will X win/be/…?" style questions so the pick can
 * show the entity instead of Yes/No.
 */
export function extractQuestionSubject(question?: string | null): string | null {
  if (!question) return null;
  const will = question.match(
    /^will\s+(.+?)\s+(?:win|be|have|get|make|reach|end|finish|beat|stay|hit|dip|post|say|attend|vote|release)\b/i,
  );
  if (!will?.[1]) return null;
  const subject = will[1].replace(/\s+vs\.?\s+.+$/i, "").trim();
  if (!subject || isGenericYesNoLabel(subject)) return null;
  if (/^(it|this|that|there|he|she|they|the)$/i.test(subject)) return null;
  // Drop leading "the price of X" → keep a tighter subject when useful.
  const priceOf = subject.match(/^the price of\s+(.+)$/i);
  if (priceOf?.[1]) return priceOf[1].trim();
  if (/^the\s+/i.test(subject) && subject.length < 12) return null;
  if (subject.length < 3) return null;
  return subject;
}

function overUnderLabel(
  outcomes: Array<{ name: string }> | undefined,
  side: "YES" | "NO",
): string | null {
  if (!outcomes?.length) return null;
  const names = outcomes.map((o) => o.name.toLowerCase());
  const hasOver = names.some((n) => n.includes("over"));
  const hasUnder = names.some((n) => n.includes("under"));
  if (!hasOver || !hasUnder) return null;
  return side === "YES" ? "Over" : "Under";
}

export type PredictionLabelMarket = {
  question?: string | null;
  selectedOutcome?: "YES" | "NO" | null;
  groupItemTitle?: string | null;
  sportsMarketType?: string | null;
  outcomes?: Array<{ name: string }>;
};

/**
 * Display label for the model pick. Prefer team / Draw / Over-Under / question
 * subject — never a bare Yes/No when a concrete label is available.
 */
export function formatPredictionLabel(
  market: PredictionLabelMarket,
  sideOverride?: "YES" | "NO" | null,
): string {
  const side = sideOverride ?? market.selectedOutcome ?? null;
  if (!side) return "—";

  const group = market.groupItemTitle?.trim();
  if (group) {
    const name = cleanGroupItemTitle(group);
    // Moneyline YES = backing that team/draw. NO should be filtered upstream.
    return side === "YES" ? name : `לא · ${name}`;
  }

  const ou = overUnderLabel(market.outcomes, side);
  if (ou) return ou;

  // Named multi-outcome markets (rare non Yes/No tokens).
  const named = market.outcomes?.find((outcome) => {
    const normalized = normalizeOutcomeSide(outcome.name);
    if (side === "YES") return normalized === "YES" || (!normalized && outcome.name);
    return normalized === "NO";
  });
  if (named && !isGenericYesNoLabel(named.name)) {
    return named.name.trim();
  }
  if (side === "YES") {
    const concrete = market.outcomes?.find((o) => !isGenericYesNoLabel(o.name));
    if (concrete && market.outcomes?.length === 1) return concrete.name.trim();
  }

  const subject = extractQuestionSubject(market.question);
  if (subject) {
    return side === "YES" ? subject : `לא · ${subject}`;
  }

  // Last resort only — still avoid English Yes/No chips on cards.
  return side === "YES" ? "לצד כן" : "לצד לא";
}

/**
 * @deprecated Prefer formatPredictionLabel(market). Kept for simple side-only
 * call sites; maps Over/Under tokens without inventing Yes/No for named picks.
 */
export function formatOutcomeLabel(value?: string | null): string {
  if (!value) return "—";
  const side = normalizeOutcomeSide(value);
  if (side === "YES" && /over/i.test(value)) return "Over";
  if (side === "NO" && /under/i.test(value)) return "Under";
  if (!isGenericYesNoLabel(value) && side == null) return value.trim();
  if (side === "YES") return "לצד כן";
  if (side === "NO") return "לצד לא";
  return value.trim() || "—";
}
