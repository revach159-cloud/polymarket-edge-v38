export type MarketStatus =
  | "active"
  | "awaiting_resolution"
  | "resolved"
  | "invalid"
  | "void"
  | "cancelled"
  | "delayed"
  | "unresolved";

export type PolymarketMarketStatus = "active" | "closed" | "resolved" | "archived";

export interface DomainMarket {
  polymarketMarketId: string;
  eventId: string | null;
  conditionId: string | null;
  question: string;
  description: string | null;
  slug: string;
  category: string | null;
  resolutionSource: string | null;
  closeTime: string | null;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  status: MarketStatus;
  yesTokenId: string | null;
  noTokenId: string | null;
  yesPrice: number | null;
  noPrice: number | null;
  volume: number | null;
  liquidity: number | null;
  sourceUpdatedAt: string;
}

export interface DomainBook {
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  midpoint: number | null;
  depth: number | null;
}

export interface GammaMarket {
  id: string;
  conditionId?: string;
  question: string;
  description?: string;
  slug?: string;
  category?: string;
  tags?: string[] | { label?: string; slug?: string }[];
  outcomes?: string | string[];
  outcomePrices?: string | string[] | number[];
  clobTokenIds?: string | string[];
  volume?: string | number;
  volumeNum?: number;
  liquidity?: string | number;
  liquidityNum?: number;
  endDate?: string;
  endDateIso?: string;
  closed?: boolean;
  active?: boolean;
  resolved?: boolean;
  umaResolutionStatus?: string;
  [key: string]: unknown;
}

export interface FetchOptions {
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export type CircuitState = "closed" | "open" | "half-open";
