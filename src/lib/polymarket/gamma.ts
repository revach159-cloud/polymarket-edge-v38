import { getGammaApiUrl } from "@/lib/env";
import { polymarketFetch } from "./client";
import { mapGammaMarket } from "./mappers";
import { gammaMarketSchema, gammaMarketsResponseSchema } from "./schemas";
import type { DomainMarket, FetchOptions } from "./types";
import { PolymarketValidationError } from "./errors";
import type { GammaMarketRaw } from "./schemas";

function extractMarkets(payload: unknown): GammaMarketRaw[] {
  if (Array.isArray(payload)) {
    const parsed = gammaMarketsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new PolymarketValidationError("Invalid gamma markets response", parsed.error);
    }
    return parsed.data;
  }
  if (payload && typeof payload === "object") {
    const obj = payload as { markets?: unknown; data?: unknown };
    const list = obj.markets ?? obj.data;
    if (Array.isArray(list)) {
      const parsed = gammaMarketsResponseSchema.safeParse(list);
      if (!parsed.success) {
        throw new PolymarketValidationError("Invalid gamma markets response", parsed.error);
      }
      return parsed.data;
    }
  }
  throw new PolymarketValidationError("Unexpected gamma markets payload shape");
}

export async function fetchMarkets(
  params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
    slug?: string;
    id?: string;
  },
  options?: FetchOptions,
): Promise<DomainMarket[]> {
  const raw = await polymarketFetch<unknown>(getGammaApiUrl(), "/markets", {
    query: {
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0,
      active: params?.active,
      closed: params?.closed,
      slug: params?.slug,
      id: params?.id,
    },
    timeoutMs: options?.timeoutMs,
    retries: options?.retries,
    signal: options?.signal,
    headers: options?.headers,
  });

  return extractMarkets(raw)
    .map((m) => {
      try {
        return mapGammaMarket(m);
      } catch {
        return null;
      }
    })
    .filter((m): m is DomainMarket => m != null);
}

export async function fetchMarketById(
  id: string,
  options?: FetchOptions,
): Promise<DomainMarket | null> {
  try {
    const raw = await polymarketFetch<unknown>(
      getGammaApiUrl(),
      `/markets/${encodeURIComponent(id)}`,
      {
        timeoutMs: options?.timeoutMs,
        retries: options?.retries,
        signal: options?.signal,
      },
    );
    const single = gammaMarketSchema.safeParse(raw);
    if (single.success) return mapGammaMarket(single.data);
  } catch {
    // fall through to list query
  }
  const list = await fetchMarkets({ id, limit: 1 }, options);
  return list[0] ?? null;
}

export async function fetchActiveMarketsPage(
  page: number,
  pageSize = 100,
  options?: FetchOptions,
): Promise<DomainMarket[]> {
  return fetchMarkets(
    {
      limit: pageSize,
      offset: page * pageSize,
      active: true,
      closed: false,
    },
    options,
  );
}

/** Alias used by server services — never mocks live data. */
export async function fetchGammaMarkets(
  params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
  },
  options?: FetchOptions,
): Promise<DomainMarket[]> {
  return fetchMarkets(params, options);
}

export async function fetchGammaMarketBySlug(
  slug: string,
  options?: FetchOptions,
): Promise<DomainMarket | null> {
  const bySlug = await fetchMarkets({ slug, limit: 5 }, options);
  if (bySlug[0]) return bySlug[0];
  return fetchMarketById(slug, options);
}
