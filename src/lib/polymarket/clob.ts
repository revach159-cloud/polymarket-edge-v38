import { getClobApiUrl } from "@/lib/env";
import { polymarketFetch } from "./client";
import { clobBookSchema, clobPriceSchema } from "./schemas";
import { mapOrderBook } from "./mappers";
import type { DomainBook } from "./types";

export async function fetchTokenPrice(tokenId: string): Promise<number | null> {
  const raw = await polymarketFetch<unknown>(getClobApiUrl(), "/price", {
    query: { token_id: tokenId, side: "buy" },
  });
  const parsed = clobPriceSchema.safeParse(raw);
  return parsed.success ? parsed.data.price : null;
}

export async function fetchOrderBook(tokenId: string): Promise<DomainBook> {
  const raw = await polymarketFetch<unknown>(getClobApiUrl(), "/book", {
    query: { token_id: tokenId },
  });
  const parsed = clobBookSchema.safeParse(raw);
  if (!parsed.success) {
    return { bestBid: null, bestAsk: null, spread: null, midpoint: null, depth: null };
  }
  return mapOrderBook(parsed.data);
}

export async function fetchMidpoint(tokenId: string): Promise<number | null> {
  const raw = await polymarketFetch<{ mid?: string | number }>(getClobApiUrl(), "/midpoint", {
    query: { token_id: tokenId },
  });
  const n = Number(raw.mid);
  return Number.isFinite(n) ? n : null;
}

export async function fetchSpread(tokenId: string): Promise<number | null> {
  const raw = await polymarketFetch<{ spread?: string | number }>(getClobApiUrl(), "/spread", {
    query: { token_id: tokenId },
  });
  const n = Number(raw.spread);
  return Number.isFinite(n) ? n : null;
}

export async function fetchPriceHistory(
  tokenId: string,
  fidelity = 60,
): Promise<Array<{ t: number; p: number }>> {
  const raw = await polymarketFetch<{ history?: Array<{ t: number; p: number }> }>(
    getClobApiUrl(),
    "/prices-history",
    { query: { market: tokenId, fidelity } },
  );
  return raw.history ?? [];
}
