import { withJobLock } from "./_lock";
import { fetchTopWallets } from "@/lib/polymarket/api";

export async function syncWalletsJob() {
  return withJobLock("sync-wallets", async () => {
    const { wallets, error } = await fetchTopWallets(20);
    if (error) {
      return { processed: 0, message: error };
    }
    return { processed: wallets.length, message: `Fetched ${wallets.length} public wallets` };
  });
}
