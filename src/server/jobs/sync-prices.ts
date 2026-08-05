import { withJobLock } from "./_lock";

export async function syncPricesJob() {
  return withJobLock("sync-prices", async () => ({
    processed: 0,
    message: "Price sync runs with market sync / live CLOB reads",
  }));
}
