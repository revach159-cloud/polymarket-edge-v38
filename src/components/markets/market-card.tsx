import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCountdown } from "@/lib/predictions/time-buckets";
import { formatNumber, formatPercent, cn } from "@/lib/utils";
import type { Market } from "@/types";

function polymarketUrl(slug: string) {
  return `https://polymarket.com/event/${encodeURIComponent(slug)}`;
}

export function MarketCard({ market }: { market: Market }) {
  const yes =
    market.marketProbability ??
    market.outcomes.find((o) => o.name.toLowerCase() === "yes")?.price;
  const outcome = market.selectedOutcome;

  return (
    <Card className="animate-fade-in flex h-full flex-col">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {market.category ? <Badge variant="muted">{market.category}</Badge> : null}
          {market.goldPick ? <Badge variant="gold">Gold</Badge> : null}
          {outcome ? (
            <Badge variant={outcome === "YES" ? "success" : "risk"}>
              בחירה: {outcome}
            </Badge>
          ) : (
            <Badge variant="outline">ללא בחירה</Badge>
          )}
        </div>
        <CardTitle className="font-display text-base leading-snug">
          <span className="ltr-isolate" dir="ltr">
            {market.question}
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          סגירה: {market.endDate ? formatCountdown(market.endDate) : "—"}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Metric label="הסתברות שוק" value={yes != null ? formatPercent(yes) : "—"} />
        <Metric
          label="הסתברות מודל"
          value={
            market.modelProbability != null
              ? formatPercent(market.modelProbability)
              : "—"
          }
        />
        <Metric
          label="Edge"
          value={
            market.edgeScore != null
              ? `${market.edgeScore > 0 ? "+" : ""}${market.edgeScore.toFixed(1)} נק'`
              : "—"
          }
          tone={market.edgeScore != null && market.edgeScore > 0 ? "success" : "muted"}
        />
        <Metric
          label="ציון איכות"
          value={
            market.qualityScore != null
              ? `${market.qualityScore.toFixed(0)}/100`
              : "—"
          }
        />
        <Metric label="נזילות" value={formatNumber(market.liquidity)} />
        <Metric label="נפח" value={formatNumber(market.volume)} />
        {market.primaryReason ? (
          <p className="col-span-2 text-xs text-muted-foreground sm:col-span-3">
            <span className="font-semibold text-success">תומך:</span>{" "}
            {market.primaryReason}
          </p>
        ) : null}
        {market.primaryRisk ? (
          <p className="col-span-2 text-xs text-muted-foreground sm:col-span-3">
            <span className="font-semibold text-warning">סיכון:</span>{" "}
            {market.primaryRisk}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto flex flex-wrap gap-2">
        <Button asChild size="sm" className="min-h-11 flex-1">
          <Link href={`/markets/${market.slug}`}>פרטים</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="min-h-11">
          <a
            href={polymarketUrl(market.slug)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
            Polymarket
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "success";
}) {
  return (
    <div className="rounded-lg bg-background-muted/70 p-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-semibold tabular-nums",
          tone === "success" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
