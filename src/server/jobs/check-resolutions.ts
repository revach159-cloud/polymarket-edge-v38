import { withJobLock } from "./_lock";
import { fetchGammaMarketBySlug } from "@/lib/polymarket/api";
import {
  listHistoryPredictions,
  resolveClosedPredictions,
} from "@/lib/history/prediction-store";
import { tryCreateAdminClient } from "@/lib/auth/supabase/admin";
import { isServiceRoleConfigured } from "@/lib/env";
import { inferMarketResolution } from "@/lib/markets/resolution";
import type { Market } from "@/types";

type ResolveJobData = Record<string, unknown>;

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
 * Resolve open tracked predictions by fetching each market from Gamma
 * (by slug / id) — not limited to a top-100 volume closed dump.
 */
export async function checkResolutionsJob() {
  return withJobLock<ResolveJobData>("check-resolutions", async () => {
    const open = listHistoryPredictions({ status: "open", limit: 0 })
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt))
      .slice(0, 800);
    if (!open.length) {
      return await resolveDbPredictionsOnly();
    }

    const fetched = await mapPool(open, 8, async (pred) => {
      const { market } = await fetchGammaMarketBySlug(pred.slug || pred.marketId);
      return market;
    });

    const closedMarkets = fetched.filter(
      (m): m is Market => Boolean(m && (m.closed || m.resolved)),
    );

    const resolvedLocal = resolveClosedPredictions(closedMarkets);

    let dbResolved = 0;
    if (isServiceRoleConfigured()) {
      dbResolved = await resolveDbOpenPredictions(closedMarkets);
    }

    return {
      processed: resolvedLocal + dbResolved,
      message: `Resolved local ${resolvedLocal}, DB ${dbResolved} (checked ${open.length} open)`,
      data: {
        open: open.length,
        closedFetched: closedMarkets.length,
        resolvedLocal,
        dbResolved,
      },
    };
  });
}

async function resolveDbPredictionsOnly(): Promise<{
  processed: number;
  message: string;
  data?: ResolveJobData;
}> {
  if (!isServiceRoleConfigured()) {
    return {
      processed: 0,
      message: "No open local history — and service role missing for DB resolve",
    };
  }
  const admin = tryCreateAdminClient();
  if (!admin) {
    return { processed: 0, message: "Admin client unavailable" };
  }

  const { data: openPreds } = await admin
    .from("predictions")
    .select("id, market_id, side, markets(polymarket_id, slug, resolved_outcome)")
    .in("status", ["active", "frozen"])
    .is("resolved_correct", null)
    .limit(500);

  if (!openPreds?.length) {
    return { processed: 0, message: "No open predictions to resolve" };
  }

  let wins = 0;
  let losses = 0;
  let voids = 0;
  let processed = 0;

  await mapPool(openPreds, 8, async (pred) => {
    const market = Array.isArray(pred.markets) ? pred.markets[0] : pred.markets;
    const slug = (market?.slug as string | undefined) ?? "";
    const polymarketId = (market?.polymarket_id as string | undefined) ?? "";
    const dbResolved = market?.resolved_outcome as string | null | undefined;

    let outcome: "yes" | "no" | "void" | null = null;
    if (dbResolved === "yes" || dbResolved === "no") {
      outcome = dbResolved;
    } else {
      const { market: gamma } = await fetchGammaMarketBySlug(
        slug || polymarketId,
      );
      if (gamma?.closed || gamma?.resolved) {
        const inferred = inferMarketResolution({ ...gamma, closed: true });
        if (inferred.side === "YES") outcome = "yes";
        else if (inferred.side === "NO") outcome = "no";
        else outcome = "void";
      }
    }

    if (!outcome) return;

    if (outcome === "void") {
      await admin
        .from("predictions")
        .update({
          status: "resolved",
          resolved_correct: null,
          resolved_at: new Date().toISOString(),
          metadata: { resolution: "void" },
        })
        .eq("id", pred.id);
      voids += 1;
      processed += 1;
      return;
    }

    const correct = pred.side === outcome;
    await admin
      .from("predictions")
      .update({
        status: "resolved",
        resolved_correct: correct,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", pred.id);

    if (correct) wins += 1;
    else losses += 1;
    processed += 1;

    await admin
      .from("markets")
      .update({
        status: "resolved",
        resolved_outcome: outcome,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", pred.market_id);
  });

  return {
    processed,
    message: `Resolved ${processed} (W${wins}/L${losses}/V${voids})`,
    data: { wins, losses, voids },
  };
}

async function resolveDbOpenPredictions(closedMarkets: Market[]): Promise<number> {
  const admin = tryCreateAdminClient();
  if (!admin) return 0;

  const byPolyId = new Map(closedMarkets.map((m) => [m.id, m]));
  const bySlug = new Map(closedMarkets.map((m) => [m.slug, m]));

  const { data: openPreds } = await admin
    .from("predictions")
    .select("id, market_id, side, markets(polymarket_id, slug)")
    .in("status", ["active", "frozen"])
    .is("resolved_correct", null)
    .limit(500);

  if (!openPreds?.length) return 0;

  let processed = 0;
  for (const pred of openPreds) {
    const market = Array.isArray(pred.markets) ? pred.markets[0] : pred.markets;
    const polyId = String(market?.polymarket_id ?? "");
    const slug = String(market?.slug ?? "");
    const gamma = byPolyId.get(polyId) ?? bySlug.get(slug);
    if (!gamma) continue;

    const inferred = inferMarketResolution({ ...gamma, closed: true });
    if (!inferred.side) {
      await admin
        .from("predictions")
        .update({
          status: "resolved",
          resolved_correct: null,
          resolved_at: new Date().toISOString(),
          metadata: { resolution: "void" },
        })
        .eq("id", pred.id);
      processed += 1;
      continue;
    }

    const outcome = inferred.side === "YES" ? "yes" : "no";
    const correct = pred.side === outcome;
    await admin
      .from("predictions")
      .update({
        status: "resolved",
        resolved_correct: correct,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", pred.id);
    await admin
      .from("markets")
      .update({
        status: "resolved",
        resolved_outcome: outcome,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", pred.market_id);
    processed += 1;
  }

  return processed;
}
