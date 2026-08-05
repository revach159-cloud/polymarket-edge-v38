import {
  fetchTopWallets,
  fetchWalletActivity,
} from "@/lib/polymarket/api";
import type { DataResult, WalletSummary, WalletTrade } from "@/types";

export async function getTopWallets(
  limit = 25,
): Promise<DataResult<WalletSummary[]>> {
  const fetchedAt = new Date().toISOString();
  const { wallets, error } = await fetchTopWallets(limit);
  return {
    data: wallets,
    stale: Boolean(error && wallets.length === 0),
    error,
    fetchedAt,
    source: wallets.length ? "polymarket" : "empty",
  };
}

export async function getWalletDetail(address: string): Promise<
  DataResult<{
    wallet: WalletSummary;
    trades: WalletTrade[];
  }>
> {
  const fetchedAt = new Date().toISOString();
  const { trades, error } = await fetchWalletActivity(address);
  return {
    data: {
      wallet: { address },
      trades,
    },
    stale: Boolean(error && trades.length === 0),
    error,
    fetchedAt,
    source: trades.length ? "polymarket" : "empty",
  };
}
