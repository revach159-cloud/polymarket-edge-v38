import {
  fetchClosedPositionPnls,
  fetchOpenUnrealizedLoss,
  fetchPnlLeaderboard,
} from "@/lib/polymarket/api";
import { evaluateEliteWallet, type EliteWindow } from "@/lib/wallets/elite";
import type { EliteWallet, WalletSummary } from "@/types";

const memoryCache: { at: number; value: EliteWallet[] | null; error?: string } = {
  at: 0,
  value: null,
};

const CACHE_MS = 5 * 60_000;
const MONTH_LIMIT = 50;
const ALL_LIMIT = 40;
/** Keep under Data API closed-positions / positions rate limits. */
const POSITION_CONCURRENCY = 10;

type SeedWallet = WalletSummary & { window: EliteWindow };

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await fn(items[index]!);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

function mergeLeaderboards(month: WalletSummary[], all: WalletSummary[]): SeedWallet[] {
  const byAddress = new Map<string, SeedWallet>();
  for (const row of all) {
    const address = row.address.toLowerCase();
    byAddress.set(address, { ...row, address, window: "all" });
  }
  for (const row of month) {
    const address = row.address.toLowerCase();
    const existing = byAddress.get(address);
    byAddress.set(address, {
      ...existing,
      ...row,
      address,
      volume: Math.max(existing?.volume ?? 0, row.volume ?? 0),
      window: "month",
    });
  }
  return [...byAddress.values()];
}

export async function collectEliteWallets(options?: {
  force?: boolean;
}): Promise<{ wallets: EliteWallet[]; error?: string }> {
  const now = Date.now();
  if (!options?.force && memoryCache.value && now - memoryCache.at < CACHE_MS) {
    return { wallets: memoryCache.value, error: memoryCache.error };
  }

  const [monthBoard, allBoard] = await Promise.all([
    fetchPnlLeaderboard(MONTH_LIMIT, "MONTH"),
    fetchPnlLeaderboard(ALL_LIMIT, "ALL"),
  ]);

  if (monthBoard.wallets.length === 0 && allBoard.wallets.length === 0) {
    const error = monthBoard.error ?? allBoard.error ?? "לוח מובילים אינו זמין כרגע";
    return { wallets: [], error };
  }

  const seeds = mergeLeaderboards(monthBoard.wallets, allBoard.wallets);
  const evaluated = await mapPool(seeds, POSITION_CONCURRENCY, async (seed) => {
    const [closed, open] = await Promise.all([
      fetchClosedPositionPnls(seed.address),
      fetchOpenUnrealizedLoss(seed.address),
    ]);
    if (closed.error && closed.pnls.length === 0) return null;
    const verdict = evaluateEliteWallet({
      pnl: seed.pnl ?? 0,
      volume: seed.volume,
      closedPnls: closed.pnls,
      openUnrealizedLoss: open.openUnrealizedLoss,
    });
    if (!verdict.eligible) return null;
    const wallet: EliteWallet = {
      address: seed.address,
      userName: seed.userName ?? null,
      pnl: verdict.pnl,
      volume: seed.volume,
      winRate: verdict.winRate,
      trades: verdict.sampleSize,
      sampleSize: verdict.sampleSize,
      wilsonLowerBound: verdict.wilsonLowerBound,
      profitFactor: verdict.profitFactor,
      lossShare: verdict.lossShare,
      grossWins: verdict.grossWins,
      grossLosses: verdict.grossLosses,
      worstLoss: verdict.worstLoss,
      bestWin: verdict.bestWin,
      openUnrealizedLoss: verdict.openUnrealizedLoss,
      roi: verdict.roi,
      eliteScore: verdict.score,
      window: seed.window,
      lossLabel: verdict.lossLabel,
      wins: verdict.wins,
      losses: verdict.losses,
    };
    return wallet;
  });

  const wallets = evaluated
    .filter((row): row is EliteWallet => row != null)
    .sort((a, b) => b.eliteScore - a.eliteScore)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  memoryCache.at = now;
  memoryCache.value = wallets;
  memoryCache.error = undefined;
  return { wallets };
}
