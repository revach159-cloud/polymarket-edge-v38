import Link from "next/link";
import { FireIcon } from "@/components/gold/fire-icon";
import { formatOutcomeLabel } from "@/lib/markets/outcome-label";
import { polymarketMarketUrl } from "@/lib/polymarket/urls";
import { formatCloseLabel } from "@/lib/predictions/time-buckets";
import { formatNumber, formatPercent, formatUsd, cn } from "@/lib/utils";
import type { Market } from "@/types";

const accentByCategory: Record<string, string> = {
  sports: "#7dff6a",
  ספורט: "#7dff6a",
  politics: "#a78bfa",
  פוליטיקה: "#a78bfa",
  world: "#38bdf8",
  עולם: "#38bdf8",
  crypto: "#f59e0b",
  קריפטו: "#f59e0b",
  business: "#22d3ee",
  עסקים: "#22d3ee",
};

export function MarketCard({
  market,
  variant = "default",
}: {
  market: Market;
  variant?: "default" | "gold";
}) {
  const isGold = variant === "gold" || Boolean(market.goldPick);
  const marketProb =
    market.marketProbability ??
    market.outcomes.find((o) => o.name.toLowerCase() === "yes")?.price ??
    market.outcomes[0]?.price;
  const modelProb = market.modelProbability ?? marketProb;
  const outcome = market.selectedOutcome;
  const selectionLabel = outcome ? formatOutcomeLabel(outcome) : null;
  const category = market.category ?? "כללי";
  const accent =
    accentByCategory[category.toLowerCase()] ??
    accentByCategory[category] ??
    (isGold ? "#ffe173" : "#38bdf8");
  const edgeLabel =
    market.edgeScore != null ? formatPercent(Math.abs(market.edgeScore)) : null;
  const winProb =
    outcome && marketProb != null
      ? outcome === "YES"
        ? marketProb
        : 1 - marketProb
      : null;
  const externalUrl = polymarketMarketUrl({
    slug: market.slug,
    eventSlug: market.eventSlug,
  });
  const closeLabel = market.endDate ? formatCloseLabel(market.endDate) : null;

  return (
    <article
      className={cn(
        "market-card-shell animate-fade-in",
        isGold && "market-card-shell-gold",
      )}
      style={{ ["--accent-line" as string]: accent }}
    >
      {isGold ? (
        <div className="market-card-gold-sheen" aria-hidden="true" />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("score-pill", isGold && "score-pill-gold")}>
              ציון {market.qualityScore != null ? Math.round(market.qualityScore) : "—"}
            </span>
            {winProb != null ? (
              <span
                className="score-pill score-pill-neutral"
                title="סבירות שוק לצד שנבחר"
              >
                {formatPercent(winProb)} ניצחון
              </span>
            ) : null}
            {edgeLabel ? (
              <span className="score-pill score-pill-neutral" title="פער מודל מול שוק">
                Edge {edgeLabel}
              </span>
            ) : null}
            {market.walletSupportCount && market.walletSupportCount > 0 ? (
              <span
                className="score-pill score-pill-wallet"
                title="כמה ארנקים מובילים נכנסו לאותו שוק לאחרונה"
              >
                {market.walletSupportCount} ארנקים
              </span>
            ) : null}
            {isGold ? (
              <span className="score-pill score-pill-gold inline-flex items-center gap-1">
                <FireIcon size="xs" />
                Gold
              </span>
            ) : null}
          </div>
          <span
            className={cn(
              "shrink-0 text-xs font-semibold",
              isGold ? "text-gold/80" : "text-muted-foreground",
            )}
          >
            {category}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold leading-snug text-foreground md:text-[0.95rem]">
            <Link
              href={`/markets/${market.slug}`}
              className="transition-colors hover:text-primary focus-visible:text-primary"
            >
              <span className="ltr-isolate" dir="ltr">
                {market.question}
              </span>
            </Link>
          </h3>
          {closeLabel ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="countdown-pill" title={market.endDate ?? undefined}>
                {closeLabel}
              </span>
            </div>
          ) : (
            <span className="countdown-pill countdown-pill-muted">זמן סגירה לא זמין</span>
          )}
          {selectionLabel ? (
            <p
              className={cn(
                "text-lg font-bold leading-tight md:text-xl",
                isGold ? "text-gold" : "text-foreground",
              )}
            >
              <span className="ltr-isolate" dir="ltr">
                {selectionLabel}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">ללא בחירת מודל</p>
          )}
          {market.primaryReason ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground/80">למה: </span>
              {market.primaryReason}
            </p>
          ) : null}
        </div>

        <div className="metrics-bar mt-auto">
          <MiniMetric label="נפח" value={formatUsd(market.volume, 0)} />
          <MiniMetric label="נזילות" value={formatUsd(market.liquidity, 0)} />
          <MiniMetric
            label="שוק"
            value={marketProb != null ? formatPercent(marketProb) : "—"}
          />
          <MiniMetric
            label="מודל"
            value={modelProb != null ? formatPercent(modelProb) : "—"}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/markets/${market.slug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background-muted/60 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-background-muted"
          >
            פרטים
          </Link>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("cta-full text-sm", isGold && "cta-full-gold")}
          >
            פתח ב־Polymarket
          </a>
        </div>
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] text-muted-foreground">{label}</div>
      <div className="truncate text-xs font-bold tabular-nums ltr-isolate">{value}</div>
    </div>
  );
}

export function MarketsStatsStrip({
  active,
  within2h,
  within5h,
  within24h,
  scanned,
  closed,
  correct,
  resolvedTotal,
  winRatePercent,
  winRateWilson,
  winRateLabel,
}: {
  active: number;
  within2h: number;
  within5h: number;
  within24h: number;
  scanned: number;
  closed: number;
  correct: number | null;
  resolvedTotal?: number;
  winRatePercent?: number | null;
  winRateWilson?: number | null;
  winRateLabel: string;
}) {
  const sample = resolvedTotal ?? 0;
  const hasSample = sample > 0 && correct != null;

  const items = [
    { label: "פועלים", value: formatNumber(active) },
    { label: "עד שעתיים", value: formatNumber(within2h) },
    { label: "עד 5 שעות", value: formatNumber(within5h) },
    { label: "עד 24 שעות", value: formatNumber(within24h) },
    { label: "נסרקו", value: formatNumber(scanned) },
    { label: "נסגרו", value: formatNumber(closed) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="stat-chip">
            <div className="stat-chip-label">{item.label}</div>
            <div className="stat-chip-value">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="stat-chip">
          <div className="stat-chip-label">צדקנו</div>
          <div className="stat-chip-value">
            {hasSample ? (
              <>
                <span className="stat-chip-value-glow ltr-isolate">
                  {formatNumber(correct)}
                </span>
                <span className="mx-1 text-sm font-medium text-muted-foreground">
                  מתוך
                </span>
                <span className="ltr-isolate text-base text-foreground">
                  {formatNumber(sample)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
        <div className="stat-chip">
          <div className="stat-chip-label">אחוז הצלחה</div>
          <div className="stat-chip-value flex flex-wrap items-baseline gap-2">
            {hasSample && winRatePercent != null ? (
              <>
                <span className="ltr-isolate text-foreground">{winRateLabel}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatNumber(correct ?? 0)} מתוך {formatNumber(closed)} סגורים
                  {winRateWilson != null ? (
                    <>
                      {" · "}
                      Wilson ≥{" "}
                      <span className="ltr-isolate">{winRateWilson}%</span>
                    </>
                  ) : null}
                </span>
              </>
            ) : (
              <span className="text-base font-medium text-muted-foreground">
                אין מדגם מוכרע עדיין
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
