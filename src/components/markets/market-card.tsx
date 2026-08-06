import Link from "next/link";
import { FireIcon } from "@/components/gold/fire-icon";
import { formatCountdown } from "@/lib/predictions/time-buckets";
import { formatNumber, formatPercent, formatUsd, cn } from "@/lib/utils";
import type { Market } from "@/types";

function polymarketUrl(slug: string) {
  return `https://polymarket.com/event/${encodeURIComponent(slug)}`;
}

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
  const selectionLabel =
    outcome === "YES"
      ? market.outcomes.find((o) => o.name.toLowerCase() === "yes")?.name ?? "YES"
      : outcome === "NO"
        ? market.outcomes.find((o) => o.name.toLowerCase() === "no")?.name ?? "NO"
        : null;
  const category = market.category ?? "כללי";
  const accent =
    accentByCategory[category.toLowerCase()] ??
    accentByCategory[category] ??
    (isGold ? "#ffe173" : "#7dff6a");
  const edgeLabel =
    market.edgeScore != null ? formatPercent(Math.abs(market.edgeScore)) : null;

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
            {edgeLabel ? (
              <span className="score-pill score-pill-edge" title="פער מודל מול שוק">
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
          {market.endDate ? (
            <span className="countdown-pill">{formatCountdown(market.endDate)}</span>
          ) : null}
          {selectionLabel ? (
            <p
              className={cn(
                "text-lg font-bold leading-tight md:text-xl",
                isGold ? "text-gold" : "text-primary",
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
            href={polymarketUrl(market.slug)}
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
  within24h,
  scanned,
  closed,
  correct,
  winRateLabel,
}: {
  active: number;
  within2h: number;
  within24h: number;
  scanned: number;
  closed: number;
  correct: number | null;
  winRateLabel: string;
}) {
  const items = [
    { label: "פועלים", value: String(active) },
    { label: "עד שעתיים", value: String(within2h) },
    { label: "עד 24 שעות", value: String(within24h) },
    { label: "נסרקו", value: formatNumber(scanned) },
    { label: "נסגרו", value: String(closed) },
    {
      label: "צדקנו?",
      value: correct == null ? "0" : String(correct),
      highlight: true,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="stat-chip">
            <div className="stat-chip-label">{item.label}</div>
            <div
              className={cn(
                "stat-chip-value",
                item.highlight && "text-primary",
              )}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
      <div className="stat-chip">
        <div className="stat-chip-label">אחוז הצלחה (מדגם מוכרע)</div>
        <div className="stat-chip-value text-base">{winRateLabel}</div>
      </div>
    </div>
  );
}
