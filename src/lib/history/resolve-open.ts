import { fetchGammaMarketBySlug } from "@/lib/polymarket/api";
import {
  listHistoryPredictions,
  resolveClosedPredictions,
} from "@/lib/history/prediction-store";
import type { Market } from "@/types";

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, concurrency) },
    async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        results[i] = await fn(items[i]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

/**
 * For open history rows not present in the current closed Gamma dump,
 * fetch each market by slug and resolve when closed — keeps נסגרו/צדקנו in sync.
 * Oldest opens first (most likely already closed).
 */
export async function resolveOpenHistoryFromGamma(options?: {
  limit?: number;
  concurrency?: number;
  knownClosedIds?: ReadonlySet<string>;
  /** Closed markets already loaded — resolve these first (no extra Gamma calls). */
  knownClosedMarkets?: readonly Market[];
}): Promise<{ checked: number; resolved: number }> {
  const limit = options?.limit ?? 250;
  const concurrency = options?.concurrency ?? 8;
  const known = options?.knownClosedIds;

  let resolvedFromKnown = 0;
  if (options?.knownClosedMarkets?.length) {
    resolvedFromKnown = resolveClosedPredictions([...options.knownClosedMarkets]);
  }

  const open = listHistoryPredictions({ status: "open", limit: 0 })
    .filter((p) => !(known && known.has(p.marketId)))
    // Oldest first — those are the ones most likely closed already.
    .sort(
      (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
    )
    .slice(0, limit);
  if (!open.length) {
    return { checked: 0, resolved: resolvedFromKnown };
  }

  const markets = await mapPool(open, concurrency, async (pred) => {
    // Always pass marketId — `?slug=` often returns [] for expired markets.
    const { market } = await fetchGammaMarketBySlug(pred.slug, pred.marketId);
    return market;
  });

  const closed = markets.filter(
    (m): m is Market => Boolean(m && (m.closed || m.resolved)),
  );
  const resolved = resolveClosedPredictions(closed);
  return { checked: open.length, resolved: resolvedFromKnown + resolved };
}
