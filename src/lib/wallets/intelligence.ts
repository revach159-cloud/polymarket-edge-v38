import { getDataApiUrl } from "@/lib/env";
import type { Market, WalletSummary } from "@/types";

export type WalletPlaybook = {
  fetchedAt: string;
  walletsAnalyzed: number;
  topWallets: Array<WalletSummary & { recentBuys: number; avgEntryPrice: number | null }>;
  insights: string[];
  priceBucketShares: Record<string, number>;
  outcomeBias: Array<{ label: string; count: number }>;
  consensusBySlug: Record<
    string,
    { score: number; supportCount: number; yesSize: number; noSize: number }
  >;
};

type ActivityTrade = {
  type?: string;
  side?: string;
  price?: number;
  size?: number;
  usdcSize?: number;
  slug?: string;
  title?: string;
  outcome?: string;
  outcomeIndex?: number;
};

type LeaderboardRow = {
  proxyWallet?: string;
  address?: string;
  pnl?: number;
  vol?: number;
  volume?: number;
  realizedPnl?: number;
  userName?: string;
};

const memoryCache: { at: number; value: WalletPlaybook | null } = {
  at: 0,
  value: null,
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "polymarket-edge-lab/1.0",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function bucketPrice(price: number): string {
  if (price < 0.35) return "ערך (<35%)";
  if (price < 0.55) return "אמצע (35–55%)";
  if (price < 0.75) return "מועדף (55–75%)";
  return "כבד (≥75%)";
}

function sideFromOutcome(outcome?: string, outcomeIndex?: number): "YES" | "NO" | null {
  const lower = (outcome ?? "").toLowerCase();
  if (lower === "yes" || lower === "y") return "YES";
  if (lower === "no" || lower === "n") return "NO";
  if (outcomeIndex === 0) return "YES";
  if (outcomeIndex === 1) return "NO";
  return null;
}

/**
 * Learn how strongest Polymarket wallets currently play:
 * entry prices, outcome lean, and per-market consensus on overlapping slugs.
 */
export async function getWalletPlaybook(options?: {
  walletLimit?: number;
  activityLimit?: number;
  force?: boolean;
}): Promise<WalletPlaybook> {
  const now = Date.now();
  if (!options?.force && memoryCache.value && now - memoryCache.at < 5 * 60_000) {
    return memoryCache.value;
  }

  const dataApi = getDataApiUrl();
  const walletLimit = options?.walletLimit ?? 10;
  const activityLimit = options?.activityLimit ?? 35;

  const board =
    (await fetchJson<LeaderboardRow[]>(
      `${dataApi}/v1/leaderboard?limit=${walletLimit}&window=week`,
    )) ??
    (await fetchJson<LeaderboardRow[]>(
      `${dataApi}/v1/leaderboard?limit=${walletLimit}&window=all`,
    )) ??
    [];

  const top = board.slice(0, walletLimit).map((row, i) => ({
    address: row.proxyWallet || row.address || `unknown-${i}`,
    pnl: row.realizedPnl ?? row.pnl,
    volume: row.volume ?? row.vol,
    rank: i + 1,
    userName: row.userName ?? null,
  }));

  const activities = await Promise.all(
    top.map(async (wallet) => {
      const trades =
        (await fetchJson<ActivityTrade[]>(
          `${dataApi}/activity?user=${encodeURIComponent(wallet.address)}&limit=${activityLimit}`,
        )) ?? [];
      return { wallet, trades };
    }),
  );

  const priceBuckets: Record<string, number> = {
    "ערך (<35%)": 0,
    "אמצע (35–55%)": 0,
    "מועדף (55–75%)": 0,
    "כבד (≥75%)": 0,
  };
  const outcomeCounter = new Map<string, number>();
  const consensus = new Map<
    string,
    { yesSize: number; noSize: number; support: Set<string> }
  >();

  const enrichedWallets = activities.map(({ wallet, trades }) => {
    const buys = trades.filter((t) => t.type === "TRADE" && t.side === "BUY");
    let priceSum = 0;
    for (const trade of buys) {
      const price = Number(trade.price ?? 0);
      const size = Number(trade.usdcSize ?? trade.size ?? 0);
      if (Number.isFinite(price) && price > 0) {
        priceBuckets[bucketPrice(price)] += 1;
        priceSum += price;
      }
      const label = trade.outcome?.trim() || "לא ידוע";
      outcomeCounter.set(label, (outcomeCounter.get(label) ?? 0) + 1);

      const slug = trade.slug?.trim();
      const side = sideFromOutcome(trade.outcome, trade.outcomeIndex);
      if (!slug || !side) continue;
      const row = consensus.get(slug) ?? {
        yesSize: 0,
        noSize: 0,
        support: new Set<string>(),
      };
      if (side === "YES") row.yesSize += Math.max(size, 0);
      else row.noSize += Math.max(size, 0);
      row.support.add(wallet.address);
      consensus.set(slug, row);
    }
    return {
      ...wallet,
      recentBuys: buys.length,
      avgEntryPrice: buys.length ? priceSum / buys.length : null,
    };
  });

  const totalBucket = Object.values(priceBuckets).reduce((a, b) => a + b, 0) || 1;
  const priceBucketShares = Object.fromEntries(
    Object.entries(priceBuckets).map(([k, v]) => [k, v / totalBucket]),
  );

  const outcomeBias = [...outcomeCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  const consensusBySlug = Object.fromEntries(
    [...consensus.entries()].map(([slug, row]) => {
      const total = row.yesSize + row.noSize;
      const score = total <= 0 ? 0.5 : row.yesSize / total;
      return [
        slug,
        {
          score,
          supportCount: row.support.size,
          yesSize: row.yesSize,
          noSize: row.noSize,
        },
      ];
    }),
  );

  const favoriteBucket =
    Object.entries(priceBucketShares).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "אמצע";
  const topOutcome = outcomeBias[0]?.label;
  const avgPnl =
    enrichedWallets.reduce((s, w) => s + (w.pnl ?? 0), 0) /
    Math.max(enrichedWallets.length, 1);

  const insights = [
    `נותחו ${enrichedWallets.length} ארנקים מובילים (שבוע/כל הזמנים) עם PnL ממוצע ≈ $${Math.round(avgPnl).toLocaleString("en-US")}.`,
    `טווח הכניסה הדומיננטי שלהם כרגע: ${favoriteBucket}.`,
    topOutcome
      ? `התוצאה/הצד הנפוץ ביותר בקניות האחרונות: ${topOutcome}.`
      : "לא זוהו מספיק עסקאות אחרונות לפילוח תוצאה.",
    `זוהו ${Object.keys(consensusBySlug).length} שווקים חופפים עם קונצנזוס ארנקים חזקים — משמשים למיון החכם ולציון המודל.`,
  ];

  const playbook: WalletPlaybook = {
    fetchedAt: new Date().toISOString(),
    walletsAnalyzed: enrichedWallets.length,
    topWallets: enrichedWallets,
    insights,
    priceBucketShares,
    outcomeBias,
    consensusBySlug,
  };
  memoryCache.at = now;
  memoryCache.value = playbook;
  return playbook;
}

export function attachWalletConsensus(
  markets: Market[],
  playbook: WalletPlaybook,
): Market[] {
  return markets.map((market) => {
    const hit =
      playbook.consensusBySlug[market.slug] ??
      playbook.consensusBySlug[market.eventId ?? ""] ??
      null;
    if (!hit) {
      return {
        ...market,
        walletConsensusScore: market.walletConsensusScore ?? null,
        walletSupportCount: market.walletSupportCount ?? null,
      };
    }
    return {
      ...market,
      walletConsensusScore: hit.score,
      walletSupportCount: hit.supportCount,
    };
  });
}
