import { isSupabaseConfigured } from "@/lib/env";
import {
  fetchGammaMarketBySlug,
  fetchGammaMarkets,
  probeClob,
  probeGamma,
} from "@/lib/polymarket/api";
import { enrichMarketWithHeuristic, enrichMarkets } from "@/lib/predictions/enrich";
import { getTimeBucket, isWithinDisplayHorizon } from "@/lib/predictions/time-buckets";
import { createClient } from "@/lib/supabase/server";
import type { DataResult, Market, MarketFilters, SystemStatus } from "@/types";

function filterMarkets(markets: Market[], filters?: MarketFilters): Market[] {
  const now = new Date();
  let list = markets.filter((m) => {
    if (m.closed) return false;
    if (!m.endDate) return false;
    return isWithinDisplayHorizon(m.endDate, now);
  });

  if (filters?.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (m) =>
        m.question.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q),
    );
  }
  if (filters?.category && filters.category !== "all") {
    list = list.filter(
      (m) => m.category?.toLowerCase() === filters.category!.toLowerCase(),
    );
  }
  if (filters?.status === "active") list = list.filter((m) => m.active && !m.closed);
  if (filters?.status === "closed") list = list.filter((m) => m.closed);
  if (filters?.goldOnly) list = list.filter((m) => m.goldPick);
  if (filters?.minQuality != null) {
    list = list.filter((m) => (m.qualityScore ?? 0) >= filters.minQuality!);
  }
  if (filters?.horizon && filters.horizon !== "all") {
    const map = {
      "2h": "within_2h",
      "6h": "within_6h",
      "24h": "within_24h",
      "3d": "within_3d",
      "7d": "within_7d",
      "30d": "within_30d",
    } as const;
    const wanted = map[filters.horizon];
    list = list.filter((m) => m.endDate && getTimeBucket(m.endDate, now) === wanted);
  }

  const sort = filters?.sort ?? "endDate";
  list.sort((a, b) => {
    if (sort === "liquidity") return b.liquidity - a.liquidity;
    if (sort === "endDate") {
      return (
        new Date(a.endDate ?? 0).getTime() - new Date(b.endDate ?? 0).getTime()
      );
    }
    if (sort === "edge") return Math.abs(b.edgeScore ?? 0) - Math.abs(a.edgeScore ?? 0);
    if (sort === "quality") return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
    return b.volume - a.volume;
  });

  return list;
}

export async function getMarkets(
  filters?: MarketFilters,
): Promise<DataResult<Market[]>> {
  const fetchedAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        let query = supabase.from("markets").select("*").limit(100);
        if (filters?.goldOnly) query = query.eq("gold_pick", true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const markets = filterMarkets(
            enrichMarkets(
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
            ),
            filters,
          );
          return {
            data: markets,
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

  const { markets, error } = await fetchGammaMarkets({
    limit: 48,
    active: filters?.status === "closed" ? undefined : true,
    closed: filters?.status === "closed" ? true : false,
  });

  if (!markets.length) {
    return {
      data: [],
      stale: true,
      error: error ?? "לא ניתן לטעון שווקים כרגע",
      fetchedAt,
      source: "empty",
    };
  }

  return {
    data: filterMarkets(enrichMarkets(markets), filters),
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
            data: {
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
            },
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
    data: market ? enrichMarketWithHeuristic(market) : null,
    stale: Boolean(error && !market),
    error: market ? undefined : error,
    fetchedAt,
    source: market ? "polymarket" : "empty",
  };
}

export async function getGoldMarkets(): Promise<DataResult<Market[]>> {
  const result = await getMarkets({ sort: "quality" });
  const gold = result.data.filter((m) => m.goldPick);
  return {
    ...result,
    data: gold,
    source: gold.length ? result.source : "empty",
  };
}

export async function getTopPicks(limit = 6): Promise<DataResult<Market[]>> {
  const result = await getMarkets({ status: "active", sort: "quality" });
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

export async function getMarketStats(): Promise<{
  markets: number;
  active: number;
  within2h: number;
  volume: number;
  liquidity: number;
}> {
  const { data } = await getMarkets({ status: "active" });
  const now = new Date();
  const within2h = data.filter((m) => {
    if (!m.endDate) return false;
    const ms = new Date(m.endDate).getTime() - now.getTime();
    return ms > 0 && ms <= 2 * 60 * 60 * 1000;
  }).length;
  return {
    markets: data.length,
    active: data.filter((m) => m.active && !m.closed).length,
    within2h,
    volume: data.reduce((s, m) => s + m.volume, 0),
    liquidity: data.reduce((s, m) => s + m.liquidity, 0),
  };
}
