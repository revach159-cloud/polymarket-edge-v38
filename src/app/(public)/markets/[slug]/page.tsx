import Link from "next/link";
import { notFound } from "next/navigation";
import { FireIcon } from "@/components/gold/fire-icon";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMarketBySlug } from "@/services/markets";
import { inferMarketResolution } from "@/lib/markets/resolution";
import { formatCountdown } from "@/lib/predictions/time-buckets";
import { formatNumber, formatPercent, formatShortDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getMarketBySlug(slug);
  const market = result.data;
  if (!market) notFound();

  const outcome = market.selectedOutcome;
  const marketProb = market.marketProbability ?? market.outcomes[0]?.price ?? null;
  const modelProb = market.modelProbability ?? marketProb;
  const resolution = inferMarketResolution(market);

  return (
    <article className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{market.category ?? "כללי"}</Badge>
          {outcome ? (
            <Badge variant="success">בחירה: {outcome}</Badge>
          ) : (
            <Badge variant="secondary">ללא בחירת מודל</Badge>
          )}
          {market.goldPick ? (
            <Badge variant="gold" className="inline-flex items-center gap-1">
              <FireIcon size="xs" />
              Gold
            </Badge>
          ) : null}
          {market.closed ? (
            <Badge variant="secondary">
              {resolution.outcomeName ? `נסגר · ${resolution.label}` : "נסגר · טרם הוכרע"}
            </Badge>
          ) : null}
        </div>
        <h1 className="font-display text-2xl font-bold leading-snug ltr-isolate">
          {market.question}
        </h1>
        {market.description ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground ltr-isolate">
            {market.description}
          </p>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm md:grid-cols-4">
        <Item
          label="סגירה"
          value={
            market.endDate
              ? `${formatCountdown(market.endDate)} · ${formatShortDate(market.endDate)}`
              : "—"
          }
        />
        <Item
          label="הסתברות שוק"
          value={marketProb != null ? formatPercent(marketProb) : "—"}
        />
        <Item
          label="הסתברות מודל"
          value={modelProb != null ? formatPercent(modelProb) : "—"}
        />
        <Item
          label="Edge"
          value={market.edgeScore != null ? formatPercent(market.edgeScore) : "—"}
        />
        <Item
          label="ציון איכות"
          value={
            market.qualityScore != null
              ? `${Math.round(market.qualityScore)}/100`
              : "—"
          }
        />
        <Item label="נזילות" value={formatNumber(market.liquidity)} />
        <Item label="נפח" value={formatNumber(market.volume)} />
        <Item
          label="Spread"
          value={market.spread != null ? formatPercent(market.spread) : "—"}
        />
      </dl>

      {(market.primaryReason || market.primaryRisk) && (
        <section className="grid gap-3 md:grid-cols-2">
          {market.primaryReason ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-primary">למה המודל בחר כך</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {market.primaryReason}
              </p>
            </div>
          ) : null}
          {market.primaryRisk ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-warning">סיכון עיקרי</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {market.primaryRisk}
              </p>
            </div>
          ) : null}
        </section>
      )}

      {market.closed ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">תוצאת הכרעה</h2>
          <p
            className={cn(
              "mt-2 text-sm",
              resolution.correct === true && "text-success",
              resolution.correct === false && "text-destructive",
            )}
          >
            תוצאה:{" "}
            <span className="ltr-isolate font-semibold" dir="ltr">
              {resolution.label}
            </span>
            {resolution.correct === true
              ? " · המודל צדק"
              : resolution.correct === false
                ? " · המודל טעה"
                : ""}
          </p>
        </section>
      ) : null}

      <DisclaimerBanner compact />

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a
            href={`https://polymarket.com/event/${market.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Polymarket
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href="/markets">חזרה לשווקים</Link>
        </Button>
      </div>
    </article>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums ltr-isolate">{value}</dd>
    </div>
  );
}
