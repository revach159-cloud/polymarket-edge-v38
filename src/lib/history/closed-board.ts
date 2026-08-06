import {
  listHistoryPredictions,
  type HistoryPrediction,
} from "@/lib/history/prediction-store";
import {
  evaluateClosedMarket,
  type ClosedMarketVerdict,
  type ClosedResolutionSummary,
} from "@/lib/markets/closed-stats";
import type { Market } from "@/types";

function historyToMarketStub(row: HistoryPrediction): Market {
  const yes =
    row.side === "YES"
      ? (row.marketProbability ?? 0.5)
      : 1 - (row.marketProbability ?? 0.5);
  return {
    id: row.marketId,
    slug: row.slug,
    question: row.marketQuestion,
    volume: 0,
    liquidity: 0,
    outcomes: [
      { id: "yes", name: "Yes", price: yes },
      { id: "no", name: "No", price: 1 - yes },
    ],
    active: false,
    closed: true,
    resolved: true,
    selectedOutcome: row.side,
    marketProbability: row.marketProbability,
    modelProbability: row.modelProbability,
    edgeScore: row.edgeScore,
    qualityScore: row.qualityScore,
    walletConsensusScore: row.walletConsensusScore,
    endDate: row.resolvedAt,
    updatedAt: row.resolvedAt ?? row.recordedAt,
  };
}

/**
 * Closed board from tracked history — same sample as נסגרו / צדקנו.
 * Prefer live closed market payload when available for richer outcome labels.
 */
export function summarizeFromHistory(
  history: HistoryPrediction[],
  closedMarkets: Market[] = [],
): ClosedResolutionSummary {
  const byId = new Map(closedMarkets.map((m) => [m.id, m]));
  const bySlug = new Map(
    closedMarkets
      .filter((m) => m.slug)
      .map((m) => [m.slug.toLowerCase(), m] as const),
  );
  const seen = new Set<string>();
  const verdicts: ClosedMarketVerdict[] = [];

  for (const row of history) {
    if (row.status !== "resolved" || row.correct == null) continue;
    const dedupeKey = row.slug?.trim()
      ? `slug:${row.slug.trim().toLowerCase()}`
      : `id:${row.marketId}`;
    if (seen.has(dedupeKey) || seen.has(`id:${row.marketId}`)) continue;
    seen.add(dedupeKey);
    seen.add(`id:${row.marketId}`);

    const live =
      byId.get(row.marketId) ??
      (row.slug ? bySlug.get(row.slug.toLowerCase()) : undefined);
    if (live) {
      const verdict = evaluateClosedMarket(live, row.side, {
        fallbackToLivePick: false,
      });
      verdicts.push({
        ...verdict,
        predictedSide: row.side,
        correct: row.correct,
        resolution: {
          ...verdict.resolution,
          label: row.resolvedOutcome ?? verdict.resolution.label,
          outcomeName: row.resolvedOutcome ?? verdict.resolution.outcomeName,
          correct: row.correct,
        },
      });
      continue;
    }

    const stub = historyToMarketStub(row);
    const opposite = row.side === "YES" ? "NO" : "YES";
    verdicts.push({
      market: stub,
      predictedSide: row.side,
      resolution: {
        label: row.resolvedOutcome ?? (row.correct ? row.side : opposite),
        outcomeName: row.resolvedOutcome,
        side: row.correct ? row.side : opposite,
        correct: row.correct,
      },
      correct: row.correct,
    });
  }

  let correct = 0;
  let incorrect = 0;
  let unresolved = 0;
  for (const v of verdicts) {
    if (v.correct === true) correct += 1;
    else if (v.correct === false) incorrect += 1;
    else unresolved += 1;
  }

  return {
    closed: verdicts.length,
    evaluable: correct + incorrect,
    correct,
    incorrect,
    unresolved,
    verdicts,
  };
}

export function listResolvedHistory(limit = 200): HistoryPrediction[] {
  return listHistoryPredictions({ status: "resolved", limit });
}
