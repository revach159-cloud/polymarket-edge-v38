import Link from "next/link";
import { Activity, ArrowLeft, Shield } from "lucide-react";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { MarketCard } from "@/components/markets/market-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMarketStats, getSystemStatus, getTopPicks } from "@/services/markets";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [status, stats, picks] = await Promise.all([
    getSystemStatus(),
    getMarketStats(),
    getTopPicks(5),
  ]);

  const statusVariant = (s: string) =>
    s === "ok" ? "success" : s === "degraded" || s === "missing" ? "warning" : "risk";

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="space-y-4">
        <p className="text-sm font-semibold text-primary">Polymarket Edge Lab</p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          מודיעין שקוף לשווקי חיזוי
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          סריקת שווקים פעילים, דירוג איכות, והפרדה בין מחיר שוק, הסתברות מודל וציון איכות. מידע
          וניתוח בלבד — ללא מסחר וללא הבטחות.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/markets">
              למודל השווקים
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="gold">
            <Link href="/gold">Gold</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Gamma" value={status.gamma} variant={statusVariant(status.gamma)} />
        <Stat title="CLOB" value={status.clob} variant={statusVariant(status.clob)} />
        <Stat title="שווקים פעילים" value={String(stats.active)} />
        <Stat title="עד שעתיים" value={String(stats.within2h)} />
      </section>

      {picks.stale || picks.error ? <StaleBanner message={picks.error} /> : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">בחירות מובילות</h2>
          <DataFreshnessBadge
            fetchedAt={picks.fetchedAt}
            stale={picks.stale}
            source={picks.source}
          />
        </div>
        {picks.data.length === 0 ? (
          <EmptyState title="אין שווקים להצגה" description="לא הצלחנו למשוך נתונים כרגע." />
        ) : (
          <div className="grid gap-4">
            {picks.data.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">מחיר שוק ≠ הסתברות מודל ≠ ציון איכות</p>
              <p className="text-sm text-muted-foreground">
                ציון איכות אינו אחוז הצלחה. המודל heuristic-v1 שקוף ואינו ML.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/disclaimer">כתב ויתור</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4" />
        בדיקת מערכת: {new Date(status.lastCheckedAt).toLocaleString("he-IL")}
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  variant,
}: {
  title: string;
  value: string;
  variant?: "success" | "warning" | "risk";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 flex items-center gap-2 font-semibold tabular-nums ltr-isolate">
        {variant ? <Badge variant={variant}>{value}</Badge> : value}
      </div>
    </div>
  );
}
