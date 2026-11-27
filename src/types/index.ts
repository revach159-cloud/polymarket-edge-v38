export type SubscriptionTier = "free" | "core" | "gold";
export type UserRole = "free" | "core" | "gold" | "admin";

export interface MarketOutcome {
  id: string;
  name: string;
  price: number;
  tokenId?: string;
}

export interface Market {
  id: string;
  slug: string;
  /** Parent Polymarket event slug — required for correct deep links. */
  eventSlug?: string | null;
  question: string;
  description?: string;
  category?: string;
  /** Polymarket sports moneyline label (team name / Draw) — not Yes/No. */
  groupItemTitle?: string | null;
  sportsMarketType?: string | null;
  imageUrl?: string;
  endDate?: string | null;
  volume: number;
  liquidity: number;
  outcomes: MarketOutcome[];
  active: boolean;
  closed: boolean;
  featured?: boolean;
  goldPick?: boolean;
  edgeScore?: number | null;
  qualityScore?: number | null;
  modelProbability?: number | null;
  marketProbability?: number | null;
  selectedOutcome?: "YES" | "NO" | null;
  primaryReason?: string | null;
  primaryRisk?: string | null;
  spread?: number | null;
  updatedAt?: string;
  conditionId?: string;
  clobTokenIds?: string[];
  eventId?: string | null;
  resolved?: boolean;
  resolutionStatus?: string | null;
  walletConsensusScore?: number | null;
  walletSupportCount?: number | null;
  smartScore?: number | null;
}

export interface MarketFilters {
  q?: string;
  category?: string;
  sort?: "smart" | "volume" | "liquidity" | "endDate" | "edge" | "quality" | "relevance";
  status?: "active" | "closed" | "all";
  goldOnly?: boolean;
  horizon?: "2h" | "5h" | "24h" | "3d" | "7d" | "30d" | "all";
  minQuality?: number;
  /** When true (default for active), apply the daily quality gate. */
  qualityOnly?: boolean;
}

export interface WalletSummary {
  address: string;
  pnl?: number;
  volume?: number;
  winRate?: number;
  trades?: number;
  sampleSize?: number;
  wilsonLowerBound?: number;
  rank?: number;
  userName?: string | null;
}

export type EliteLossLabel = "none" | "tiny" | "controlled";
export type EliteWindow = "month" | "all";

export interface EliteWallet extends WalletSummary {
  profitFactor: number;
  lossShare: number;
  grossWins: number;
  grossLosses: number;
  worstLoss: number;
  bestWin: number;
  openUnrealizedLoss: number;
  roi: number | null;
  eliteScore: number;
  window: EliteWindow;
  lossLabel: EliteLossLabel;
  wins: number;
  losses: number;
}

export interface WalletTrade {
  id: string;
  marketSlug?: string;
  marketQuestion?: string;
  side: "BUY" | "SELL";
  outcome?: string;
  price: number;
  size: number;
  timestamp: string;
}

export interface SystemStatus {
  gamma: "ok" | "degraded" | "down";
  clob: "ok" | "degraded" | "down";
  supabase: "ok" | "missing" | "down";
  lastCheckedAt: string;
  dataFreshnessMs?: number;
}

export interface DataResult<T> {
  data: T;
  stale: boolean;
  error?: string;
  fetchedAt: string;
  source: "supabase" | "polymarket" | "cache" | "empty";
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor?: string;
  target?: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface Profile {
  id: string;
  email: string;
  displayName?: string | null;
  tier: SubscriptionTier;
  role: UserRole;
  plan: SubscriptionTier;
  createdAt?: string;
  onboardingCompleted?: boolean;
}
