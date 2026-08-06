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
 */
export async function resolveOpenHistoryFromGamma(options?: {
  limit?: number;
  concurrency?: number;
  knownClosedIds?: ReadonlySet<string>;
}): Promise<{ checked: number; resolved: number }> {
  const limit = options?.limit ?? 40;
  const concurrency = options?.concurrency ?? 4;
  const known = options?.knownClosedIds;
  const open = listHistoryPredictions({ status: "open", limit }).filter(
    (p) => !(known && known.has(p.marketId)),
  );
  if (!open.length) return { checked: 0, resolved: 0 };

  const markets = await mapPool(open, concurrency, async (pred) => {
    const { market } = await fetchGammaMarketBySlug(pred.slug || pred.marketId);
    return market;
  });

  const closed = markets.filter(
    (m): m is Market => Boolean(m && (m.closed || m.resolved)),
  );
  const resolved = resolveClosedPredictions(closed);
  return { checked: open.length, resolved };
}
