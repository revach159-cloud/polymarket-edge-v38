import { getDataApiUrl } from "@/lib/env";
import { polymarketFetch } from "./client";
import { z } from "zod";

const positionSchema = z
  .object({
    proxyWallet: z.string().optional(),
    asset: z.string().optional(),
    conditionId: z.string().optional(),
    size: z.union([z.string(), z.number()]).optional(),
    avgPrice: z.union([z.string(), z.number()]).optional(),
    curPrice: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    slug: z.string().optional(),
    outcome: z.string().optional(),
  })
  .passthrough();

export async function fetchWalletPositions(address: string) {
  const raw = await polymarketFetch<unknown>(getDataApiUrl(), "/positions", {
    query: { user: address },
  });
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((row) => positionSchema.safeParse(row))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export async function fetchWalletActivity(address: string) {
  return polymarketFetch<unknown[]>(getDataApiUrl(), "/activity", {
    query: { user: address, limit: 50 },
  });
}

export async function fetchLeaderboard(limit = 20) {
  try {
    return await polymarketFetch<unknown[]>(getDataApiUrl(), "/v1/leaderboard", {
      query: { limit },
      retries: 1,
    });
  } catch {
    return [];
  }
}
