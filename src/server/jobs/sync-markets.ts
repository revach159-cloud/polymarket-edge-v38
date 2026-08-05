import { withJobLock } from "./_lock";
import { fetchGammaMarkets } from "@/lib/polymarket/api";
import { isSupabaseConfigured } from "@/lib/env";
import { tryCreateAdminClient } from "@/lib/auth/supabase/admin";

export async function syncMarketsJob() {
  return withJobLock("sync-markets", async () => {
    const { markets, error } = await fetchGammaMarkets({ limit: 100, active: true, closed: false });
    if (error) throw new Error(error);
    if (!isSupabaseConfigured()) {
      return { processed: markets.length, message: "Supabase not configured — fetched only" };
    }
    const admin = tryCreateAdminClient();
    if (!admin) {
      return { processed: markets.length, message: "Service role missing — fetched only" };
    }
    let processed = 0;
    for (const m of markets) {
      const { error: upsertError } = await admin.from("markets").upsert(
        {
          polymarket_id: m.id,
          slug: m.slug,
          question: m.question,
          description: m.description ?? null,
          category: m.category ?? null,
          status: m.closed ? "closed" : "active",
          yes_price: m.outcomes[0]?.price ?? null,
          no_price: m.outcomes[1]?.price ?? null,
          volume: m.volume,
          liquidity: m.liquidity,
          end_date: m.endDate,
          clob_token_ids: m.clobTokenIds ?? [],
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "polymarket_id" },
      );
      if (!upsertError) processed += 1;
    }
    return { processed, message: `Upserted ${processed} markets` };
  });
}
