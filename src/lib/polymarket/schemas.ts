import { z } from "zod";

export const gammaMarketSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    question: z.string().optional(),
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
    conditionId: z.string().nullable().optional(),
    condition_id: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    end_date_iso: z.string().nullable().optional(),
    closed: z.boolean().optional(),
    active: z.boolean().optional(),
    resolved: z.boolean().optional(),
    umaResolutionStatus: z.string().nullable().optional(),
    resolutionSource: z.string().nullable().optional(),
    volume: z.union([z.string(), z.number()]).optional(),
    liquidity: z.union([z.string(), z.number()]).optional(),
    outcomePrices: z.union([z.string(), z.array(z.string())]).optional(),
    outcomes: z.union([z.string(), z.array(z.string())]).optional(),
    clobTokenIds: z.union([z.string(), z.array(z.string())]).optional(),
    events: z
      .array(
        z.object({
          id: z.union([z.string(), z.number()]).transform(String).optional(),
          slug: z.string().optional(),
          title: z.string().optional(),
        }),
      )
      .optional(),
    category: z.string().nullable().optional(),
    tags: z
      .array(z.object({ id: z.union([z.string(), z.number()]).optional(), label: z.string().optional(), slug: z.string().optional() }))
      .optional(),
  })
  .passthrough();

export const gammaMarketsResponseSchema = z.array(gammaMarketSchema);

export const clobPriceSchema = z.object({
  price: z.union([z.string(), z.number()]).transform(Number),
});

export const clobBookSchema = z
  .object({
    bids: z
      .array(z.object({ price: z.union([z.string(), z.number()]), size: z.union([z.string(), z.number()]) }))
      .optional(),
    asks: z
      .array(z.object({ price: z.union([z.string(), z.number()]), size: z.union([z.string(), z.number()]) }))
      .optional(),
  })
  .passthrough();

export type GammaMarketRaw = z.infer<typeof gammaMarketSchema>;
