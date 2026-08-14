import { wilsonLowerBound } from "@/lib/analytics/stats";

/** Minimum realized leaderboard PnL (USD) to even be considered. */
export const ELITE_MIN_PNL = 20_000;
/** Closed-position sample — tiny streaks are noise. */
export const ELITE_MIN_SAMPLE = 8;
/** Share of closed positions that paid out. */
export const ELITE_MIN_WIN_RATE = 0.68;
/** Gross wins / gross losses on the closed sample. */
export const ELITE_MIN_PROFIT_FACTOR = 4;
/** Dollar losses as a share of |wins| + |losses|. */
export const ELITE_MAX_LOSS_SHARE = 0.16;
/** Wilson lower bound so 8/8 is OK but 8/12 at 67% is not. */
export const ELITE_MIN_WILSON = 0.48;
/** Cap open mark-to-market losses vs headline PnL. */
export const ELITE_MAX_OPEN_LOSS_VS_PNL = 0.4;
/** Cap open mark-to-market losses vs sampled closed wins. */
export const ELITE_MAX_OPEN_LOSS_VS_GROSS_WINS = 0.45;
/** JSON-safe cap for infinite profit factor (no closed losses). */
export const PROFIT_FACTOR_CAP = 99;

export type EliteLossLabel = "none" | "tiny" | "controlled";
export type EliteWindow = "month" | "all";

export type ClosedPnlSummary = {
  sampleSize: number;
  wins: number;
  losses: number;
  winRate: number;
  wilsonLowerBound: number;
  grossWins: number;
  grossLosses: number;
  profitFactor: number;
  lossShare: number;
  worstLoss: number;
  bestWin: number;
};

export type EliteCandidate = {
  pnl: number;
  volume?: number | null;
  closedPnls: number[];
  openUnrealizedLoss: number;
};

export type EliteEvaluation = ClosedPnlSummary & {
  pnl: number;
  roi: number | null;
  openUnrealizedLoss: number;
  eligible: boolean;
  score: number;
  lossLabel: EliteLossLabel;
};

export function summarizeClosedPnls(pnls: number[]): ClosedPnlSummary {
  const finite = pnls.filter((n) => Number.isFinite(n));
  const wins = finite.filter((n) => n > 0);
  const losses = finite.filter((n) => n < 0);
  const sampleSize = finite.length;
  const winCount = wins.length;
  const lossCount = losses.length;
  const grossWins = wins.reduce((s, n) => s + n, 0);
  const grossLosses = Math.abs(losses.reduce((s, n) => s + n, 0));
  const winRate = sampleSize > 0 ? winCount / sampleSize : 0;
  const profitFactor =
    grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? PROFIT_FACTOR_CAP : 0;
  const lossShare =
    grossWins + grossLosses > 0 ? grossLosses / (grossWins + grossLosses) : sampleSize > 0 ? 1 : 0;

  return {
    sampleSize,
    wins: winCount,
    losses: lossCount,
    winRate,
    wilsonLowerBound: wilsonLowerBound(winCount, sampleSize),
    grossWins,
    grossLosses,
    profitFactor: Math.min(PROFIT_FACTOR_CAP, profitFactor),
    lossShare,
    worstLoss: losses.length ? Math.min(...losses) : 0,
    bestWin: wins.length ? Math.max(...wins) : 0,
  };
}

export function eliteLossLabel(summary: ClosedPnlSummary): EliteLossLabel {
  if (summary.losses === 0 || summary.lossShare === 0) return "none";
  if (summary.lossShare <= 0.05) return "tiny";
  return "controlled";
}

export function eliteLossLabelHe(label: EliteLossLabel): string {
  if (label === "none") return "בלי הפסדים בדגימה";
  if (label === "tiny") return "הפסדים זעירים";
  return "הפסדים נשלטים";
}

export function scoreEliteWallet(pnl: number, summary: ClosedPnlSummary): number {
  const pnlScore = Math.log10(Math.max(pnl, 1));
  const pf = 1 + summary.profitFactor;
  const wilson = 0.4 + summary.wilsonLowerBound;
  const keep = 1 - summary.lossShare;
  return pnlScore * pf * wilson * keep;
}

function hidesOpenLosses(
  pnl: number,
  summary: ClosedPnlSummary,
  openUnrealizedLoss: number,
): boolean {
  const open = Math.max(0, openUnrealizedLoss);
  if (open <= 0) return false;
  const vsPnl = open / Math.max(pnl, 1);
  const vsWins = open / Math.max(summary.grossWins, 1);
  return vsPnl > ELITE_MAX_OPEN_LOSS_VS_PNL && vsWins > ELITE_MAX_OPEN_LOSS_VS_GROSS_WINS;
}

export function evaluateEliteWallet(candidate: EliteCandidate): EliteEvaluation {
  const summary = summarizeClosedPnls(candidate.closedPnls);
  const pnl = Number.isFinite(candidate.pnl) ? candidate.pnl : 0;
  const volume = candidate.volume;
  const roi = volume != null && Number.isFinite(volume) && volume > 0 ? pnl / volume : null;
  const openUnrealizedLoss = Math.max(0, candidate.openUnrealizedLoss || 0);
  const eligible =
    pnl >= ELITE_MIN_PNL &&
    summary.sampleSize >= ELITE_MIN_SAMPLE &&
    summary.winRate >= ELITE_MIN_WIN_RATE &&
    summary.profitFactor >= ELITE_MIN_PROFIT_FACTOR &&
    summary.lossShare <= ELITE_MAX_LOSS_SHARE &&
    summary.wilsonLowerBound >= ELITE_MIN_WILSON &&
    !hidesOpenLosses(pnl, summary, openUnrealizedLoss);

  return {
    ...summary,
    pnl,
    roi,
    openUnrealizedLoss,
    eligible,
    score: eligible ? scoreEliteWallet(pnl, summary) : 0,
    lossLabel: eliteLossLabel(summary),
  };
}

export function walletDisplayName(userName: string | null | undefined, address: string): string {
  const name = userName?.trim();
  if (!name) return address;
  if (/^0x[a-fA-F0-9]{6,}/i.test(name)) return address;
  return name;
}

export function formatProfitFactor(profitFactor: number): string {
  if (!Number.isFinite(profitFactor) || profitFactor >= PROFIT_FACTOR_CAP) return "∞";
  return profitFactor >= 10 ? profitFactor.toFixed(0) : profitFactor.toFixed(1);
}
