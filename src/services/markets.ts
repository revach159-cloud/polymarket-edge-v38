import { isSupabaseConfigured } from "@/lib/env";
import {
  fetchActivePredictionUniverse,
  fetchGammaMarketBySlug,
  fetchGammaMarketsPaged,
  probeClob,
  probeGamma,
} from "@/lib/polymarket/api";
import { enrichMarketWithHeuristic, enrichMarkets } from "@/lib/predictions/enrich";
import { computeMarketStats } from "@/lib/markets/stats";
import { applySmartSearch, computeSmartScore } from "@/lib/markets/smart-rank";
import { selectDailyPredictions } from "@/lib/markets/quality-gate";
import { dedupeMarkets } from "@/lib/markets/dedupe";
import {
  listHistoryPredictions,
  recordedPredictionSides,
  resolveClosedPredictions,
  syncPredictionHistory,
  type HistoryPrediction,
} from "@/lib/history/prediction-store";
import { resolveOpenHistoryFromGamma } from "@/lib/history/resolve-open";
import { getWalletPlaybook } from "@/lib/wallets/intelligence";
import { isWithinDisplayHorizon, getTimeBucket } from "@/lib/predictions/time-buckets";
import { createClient } from "@/lib/supabase/server";
import type { DataResult, Market, MarketFilters, SystemStatus } from "@/types";

function filterMarkets(markets: Market[], filters?: MarketFilters): Market[] {
  const now = new Date();
  let list = markets.filter((m) => {
    if (filters?.status === "closed") return m.closed || m.resolved;
    // Active / default card feeds: never mix closed markets into the list.
    return Boolean(
      m.active &&
        !m.closed &&
        !m.resolved &&
        m.endDate &&
        isWithinDisplayHorizon(m.endDate, now),
    );
  });

  if (filters?.q) {
    list = applySmartSearch(list, filters.q);
  }
  if (filters?.category && filters.category !== "all") {
    list = list.filter(
      (m) => m.category?.toLowerCase() === filters.category!.toLowerCase(),
    );
  }
  if (filters?.status === "active") {
    list = list.filter((m) => m.active && !m.closed && !m.resolved);
  }
  if (filters?.status === "closed") list = list.filter((m) => m.closed || m.resolved);
  if (filters?.goldOnly) list = list.filter((m) => m.goldPick);
  if (filters?.minQuality != null) {
    list = list.filter((m) => (m.qualityScore ?? 0) >= filters.minQuality!);
  }
  if (filters?.horizon && filters.horizon !== "all") {
    const map: Record<string, string[]> = {
      "2h": ["within_2h"],
      "5h": ["within_2h", "within_5h"],
      "24h": ["within_2h", "within_5h", "within_24h"],
      "3d": ["within_3d"],
      "7d": ["within_7d"],
      "30d": ["within_30d"],
    };
    const wanted = map[filters.horizon] ?? [];
    list = list.filter(
      (m) => m.endDate && wanted.includes(getTimeBucket(m.endDate, now)),
    );
  }

  // Active list: keep 250+ quality predictions, near-close first, unique markets only.
  const qualityOnly = filters?.qualityOnly !== false;
  if (qualityOnly && (filters?.status === "active" || !filters?.status)) {
    list = selectDailyPredictions(list, now);
  }

  list = dedupeMarkets(list);

  const sort = filters?.sort ?? "smart";
  if (filters?.q && (sort === "smart" || sort === "relevance")) {
    if (sort === "relevance") return list;
  }

  list.sort((a, b) => {
    if (sort === "liquidity") return b.liquidity - a.liquidity;
    if (sort === "endDate") {
      return (
        new Date(a.endDate ?? 0).getTime() - new Date(b.endDate ?? 0).getTime()
      );
    }
    if (sort === "edge") return Math.abs(b.edgeScore ?? 0) - Math.abs(a.edgeScore ?? 0);
    if (sort === "quality") return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
    if (sort === "volume") return b.volume - a.volume;
    if (sort === "relevance") return (b.smartScore ?? 0) - (a.smartScore ?? 0);
    return (
      (b.smartScore ?? computeSmartScore(b, now)) -
      (a.smartScore ?? computeSmartScore(a, now))
    );
  });

  return list;
}

async function loadConsensusMap() {
  try {
    const playbook = await getWalletPlaybook({ walletLimit: 10, activityLimit: 40 });
    return playbook.consensusBySlug;
  } catch {
    return {};
  }
}

export async function getMarkets(
  filters?: MarketFilters,
): Promise<DataResult<Market[]>> {
  const fetchedAt = new Date().toISOString();
  const consensusBySlug = await loadConsensusMap();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        let query = supabase.from("markets").select("*").limit(500);
        if (filters?.goldOnly) query = query.eq("gold_pick", true);
        const { data, error } = await query;
        if (!error && data && data.length >= 250) {
          const enriched = enrichMarkets(
            data.map((row) => ({
              id: String(row.id),
              slug: row.slug,
              question: row.question,
              description: row.description ?? undefined,
              category: row.category ?? undefined,
              imageUrl: row.image_url ?? undefined,
              endDate: row.end_date ?? null,
              volume: Number(row.volume ?? 0),
              liquidity: Number(row.liquidity ?? 0),
              outcomes: Array.isArray(row.outcomes) ? row.outcomes : [],
              active: Boolean(row.active),
              closed: Boolean(row.closed),
              featured: Boolean(row.featured),
              goldPick: Boolean(row.gold_pick),
              edgeScore: row.edge_score != null ? Number(row.edge_score) : null,
              updatedAt: row.updated_at ?? undefined,
            })),
            new Date(),
            consensusBySlug,
          );
          return {
            data: filterMarkets(enriched, filters),
            stale: false,
            fetchedAt,
            source: "supabase",
          };
        }
      }
    } catch {
      // fall through to public API
    }
  }

  const status = filters?.status ?? "active";
  let markets: Market[] = [];
  let error: string | undefined;

  if (status === "closed") {
    const closed = await fetchGammaMarketsPaged({
      closed: true,
      order: "updatedAt",
      ascending: false,
      pageSize: 100,
      maxPages: 5,
    });
    markets = closed.markets;
    error = closed.error;
  } else {
    const [universe, closed] = await Promise.all([
      fetchActivePredictionUniverse(),
      // Keep closed batch warm for history / win-rate matching.
      fetchGammaMarketsPaged({
        closed: true,
        order: "updatedAt",
        ascending: false,
        pageSize: 100,
        maxPages: 4,
      }),
    ]);
    const byId = new Map<string, Market>();
    for (const market of universe.markets) byId.set(market.id, market);
    for (const market of closed.markets) byId.set(market.id, market);
    markets = [...byId.values()];
    error = universe.error ?? closed.error;
  }

  if (!markets.length) {
    return {
      data: [],
      stale: true,
      error: error ?? "לא ניתן לטעון שווקים כרגע",
      fetchedAt,
      source: "empty",
    };
  }

  const enriched = enrichMarkets(markets, new Date(), consensusBySlug);
  const active = enriched.filter((m) => m.active && !m.closed);
  const closedRows = enriched.filter((m) => m.closed || m.resolved);
  // Only full-sync when this fetch includes actives. Closed-only parallel calls
  // used to race and overwrite opens with an empty snapshot (נסגרו stuck at 0).
  if (active.length > 0) {
    syncPredictionHistory(active, closedRows);
  } else if (closedRows.length > 0) {
    // Resolve against opens another concurrent fetch may already have recorded.
    resolveClosedPredictions(closedRows);
  }

  return {
    data: filterMarkets(enriched, filters),
    stale: Boolean(error),
    error,
    fetchedAt,
    source: "polymarket",
  };
}

export async function getMarketBySlug(
  slug: string,
): Promise<DataResult<Market | null>> {
  const fetchedAt = new Date().toISOString();
  const consensusBySlug = await loadConsensusMap();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("markets")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (data) {
          return {
            data: enrichMarketWithHeuristic(
              {
                id: String(data.id),
                slug: data.slug,
                question: data.question,
                description: data.description ?? undefined,
                category: data.category ?? undefined,
                imageUrl: data.image_url ?? undefined,
                endDate: data.end_date ?? null,
                volume: Number(data.volume ?? 0),
                liquidity: Number(data.liquidity ?? 0),
                outcomes: Array.isArray(data.outcomes) ? data.outcomes : [],
                active: Boolean(data.active),
                closed: Boolean(data.closed),
                featured: Boolean(data.featured),
                goldPick: Boolean(data.gold_pick),
                edgeScore:
                  data.edge_score != null ? Number(data.edge_score) : null,
                updatedAt: data.updated_at ?? undefined,
                clobTokenIds: Array.isArray(data.clob_token_ids)
                  ? data.clob_token_ids
                  : undefined,
                walletConsensusScore: consensusBySlug[data.slug]?.score ?? null,
                walletSupportCount: consensusBySlug[data.slug]?.supportCount ?? null,
              },
              new Date(),
              { walletConsensusScore: consensusBySlug[data.slug]?.score ?? null },
            ),
            stale: false,
            fetchedAt,
            source: "supabase",
          };
        }
      }
    } catch {
      // fall through
    }
  }

  const { market, error } = await fetchGammaMarketBySlug(slug);
  return {
    data: market
      ? enrichMarketWithHeuristic(
          {
            ...market,
            walletConsensusScore: consensusBySlug[market.slug]?.score ?? null,
            walletSupportCount: consensusBySlug[market.slug]?.supportCount ?? null,
          },
          new Date(),
          { walletConsensusScore: consensusBySlug[market.slug]?.score ?? null },
        )
      : null,
    stale: Boolean(error && !market),
    error: market ? undefined : error,
    fetchedAt,
    source: market ? "polymarket" : "empty",
  };
}

export async function getGoldMarkets(): Promise<DataResult<Market[]>> {
  const result = await getMarkets({ sort: "smart", status: "active" });
  const gold = result.data.filter((m) => m.goldPick);
  return {
    ...result,
    data: gold,
    source: gold.length ? result.source : "empty",
  };
}

export async function getTopPicks(limit = 6): Promise<DataResult<Market[]>> {
  const result = await getMarkets({ status: "active", sort: "smart" });
  return {
    ...result,
    data: result.data.slice(0, limit),
  };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const [gamma, clob] = await Promise.all([probeGamma(), probeClob()]);
  const supabase = isSupabaseConfigured() ? "ok" : "missing";
  return {
    gamma,
    clob,
    supabase,
    lastCheckedAt: new Date().toISOString(),
  };
}

export type ResolvedPrediction = {
  id: string;
  marketId: string;
  marketQuestion: string;
  side: string;
  correct: boolean;
  resolvedAt: string | null;
  resolvedOutcome?: string | null;
  slug?: string;
  edgeScore?: number | null;
  qualityScore?: number | null;
  marketProbability?: number | null;
  confidence?: number | null;
  category?: string | null;
};

function toResolved(prediction: HistoryPrediction): ResolvedPrediction {
  return {
    id: prediction.id,
    marketId: prediction.marketId,
    marketQuestion: prediction.marketQuestion,
    side: prediction.side,
    correct: Boolean(prediction.correct),
    resolvedAt: prediction.resolvedAt,
    resolvedOutcome: prediction.resolvedOutcome,
    slug: prediction.slug,
    edgeScore: prediction.edgeScore,
    qualityScore: prediction.qualityScore,
    marketProbability: prediction.marketProbability,
  };
}

export async function getResolvedPredictions(limit = 500): Promise<ResolvedPrediction[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("predictions")
          .select(
            "id, market_id, side, edge, confidence, quality_score, market_probability, resolved_correct, resolved_at, is_gold, markets(question, slug, category)",
          )
          .not("resolved_correct", "is", null)
          .order("resolved_at", { ascending: false })
          .limit(limit);
        if (!error && data?.length) {
          return data.map((row) => {
            const market = Array.isArray(row.markets) ? row.markets[0] : row.markets;
            return {
              id: row.id,
              marketId: row.market_id,
              marketQuestion: market?.question ?? "שוק ללא כותרת",
              side: row.side,
              correct: Boolean(row.resolved_correct),
              resolvedAt: row.resolved_at,
              slug: market?.slug,
              edgeScore: row.edge != null ? Number(row.edge) : null,
              qualityScore:
                row.quality_score != null ? Number(row.quality_score) * 100 : null,
              marketProbability:
                row.market_probability != null
                  ? Number(row.market_probability)
                  : null,
              confidence: row.confidence != null ? Number(row.confidence) : null,
              category: market?.category ?? null,
            };
          });
        }
      }
    } catch {
      // fall through to local/live history
    }
  }

  // Honest history only — never invent resolved rows from post-close prices.
  return listHistoryPredictions({ status: "resolved", limit }).map(toResolved);
}

export async function getMarketStats() {
  const { ensurePredictionHistoryReady, persistPredictionHistory } =
    await import("@/lib/history/ensure-history");
  await ensurePredictionHistoryReady();

  const [activeResult, closedResult] = await Promise.all([
    getMarkets({ status: "active", sort: "smart" }),
    getMarkets({ status: "closed", sort: "endDate", qualityOnly: false }),
  ]);

  // getMarkets already syncs open→closed history; score from the closed list.
  syncPredictionHistory(activeResult.data, closedResult.data);

  // Resolve open tracked picks even if they were missing from the closed dump.
  await resolveOpenHistoryFromGamma({
    limit: 250,
    concurrency: 8,
    knownClosedIds: new Set(closedResult.data.map((m) => m.id)),
    knownClosedMarkets: closedResult.data,
  });
  await persistPredictionHistory();

  const sides = recordedPredictionSides();
  return computeMarketStats(activeResult.data, closedResult.data, sides);
}
