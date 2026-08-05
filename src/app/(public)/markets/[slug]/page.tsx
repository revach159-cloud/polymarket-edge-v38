import Link from "next/link";
import { notFound } from "next/navigation";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMarketBySlug } from "@/services/markets";
import { formatCountdown } from "@/lib/predictions/time-buckets";
import { formatNumber, formatPercent } from "@/lib/utils";

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

  const outcome = market.selectedOutcome ?? "YES";
  const marketProb = market.marketProbability ?? market.outcomes[0]?.price ?? 0;
  const modelProb = market.modelProbability ?? marketProb;

  return (
    <article className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{market.category ?? "כללי"}</Badge>
          <Badge variant="success">בחירה: {outcome}</Badge>
          {market.goldPick ? <Badge variant="gold">Gold</Badge> : null}
        </div>
        <h1 className="font-display text-2xl font-bold leading-snug ltr-isolate">{market.question}</h1>
        {market.description ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground ltr-isolate">
            {market.description}
          </p>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm md:grid-cols-4">
        <Item label="סגירה" value={market.endDate ? formatCountdown(market.endDate) : "—"} />
        <Item label="הסתברות שוק" value={formatPercent(marketProb)} />
        <Item label="הסתברות מודל" value={formatPercent(modelProb)} />
        <Item label="Edge" value={formatPercent(market.edgeScore ?? 0)} />
        <Item label="ציון איכות" value={`${Math.round(market.qualityScore ?? 0)}/100`} />
        <Item label="נזילות" value={formatNumber(market.liquidity)} />
        <Item label="נפח" value={formatNumber(market.volume)} />
        <Item label="Spread" value={market.spread != null ? formatPercent(market.spread) : "—"} />
      </dl>

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
          <Link href="/markets">חזרה</Link>
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
