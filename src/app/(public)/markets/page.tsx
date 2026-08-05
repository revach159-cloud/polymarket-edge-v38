import Link from "next/link";
import { Suspense } from "react";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { MarketCard, MarketsStatsStrip } from "@/components/markets/market-card";
import { MarketFilters } from "@/components/markets/market-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { inferMarketResolution } from "@/lib/markets/resolution";
import { computeMarketStats } from "@/lib/markets/stats";
import { formatShortDate, cn } from "@/lib/utils";
import { getMarkets, getResolvedPredictions } from "@/services/markets";
import type { MarketFilters as Filters } from "@/types";

export const metadata = { title: "מודל השווקים" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters: Filters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    sort: (typeof sp.sort === "string" ? sp.sort : "endDate") as Filters["sort"],
    status: (typeof sp.status === "string" ? sp.status : "active") as Filters["status"],
    category: typeof sp.category === "string" ? sp.category : undefined,
    horizon: (typeof sp.horizon === "string" ? sp.horizon : "all") as Filters["horizon"],
  };

  const [result, closedMarkets, activeForStats, resolvedPredictions] = await Promise.all([
    getMarkets(filters),
    getMarkets({ status: "closed", sort: "endDate" }),
    filters.status === "active" && !filters.q && !filters.category && filters.horizon === "all"
      ? Promise.resolve(null)
      : getMarkets({ status: "active" }),
    getResolvedPredictions(1_000),
  ]);

  const stats = computeMarketStats(
    activeForStats?.data ?? (filters.status === "active" ? result.data : []),
    closedMarkets.data,
    resolvedPredictions,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">מודל השווקים</h1>
          <p className="mt-1 text-muted-foreground">
            שווקים פעילים עד 30 יום לסגירה · נתונים ציבוריים מ־Polymarket
          </p>
        </div>
        <DataFreshnessBadge
          fetchedAt={result.fetchedAt}
          stale={result.stale}
          source={result.source}
        />
      </div>

      {result.stale || result.error ? <StaleBanner message={result.error} /> : null}

      <MarketsStatsStrip {...stats} />

      <Suspense fallback={<LoadingState rows={1} />}>
        <MarketFilters resultCount={result.data.length} />
      </Suspense>

      {result.data.length === 0 ? (
        <EmptyState
          title="לא נמצאו שווקים שמתאימים למסננים שבחרת."
          description="נסו לאפס מסננים או לחזור מאוחר יותר."
          action={
            <Link
              href="/markets"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              איפוס מסננים
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {result.data.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold">שווקים שנסגרו</h2>
          <p className="text-sm text-muted-foreground">
            סגירת שוק אינה מעידה על נכונות מודל; תוצאות מוצגות רק לאחר הכרעה ברורה.
          </p>
        </div>
        {closedMarkets.data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            אין שווקים סגורים במשיכה הנוכחית.
          </div>
        ) : (
          <div className="data-table overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>שוק</th>
                  <th>בחירה</th>
                  <th>תוצאה</th>
                  <th>צדק?</th>
                  <th>תאריך</th>
                </tr>
              </thead>
              <tbody>
                {closedMarkets.data.slice(0, 10).map((market) => {
                  const resolution = inferMarketResolution(market);
                  return (
                    <tr key={market.id}>
                      <td className="max-w-[28rem]">
                        <Link
                          href={`/markets/${market.slug}`}
                          className="line-clamp-2 font-medium hover:text-primary hover:underline"
                        >
                          <span className="ltr-isolate" dir="ltr">
                            {market.question}
                          </span>
                        </Link>
                      </td>
                      <td className="ltr-isolate">{market.selectedOutcome ?? "—"}</td>
                      <td>
                        <span className="ltr-isolate" dir="ltr">
                          {resolution.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            "font-semibold",
                            resolution.correct === true && "text-success",
                            resolution.correct === false && "text-destructive",
                            resolution.correct == null && "text-muted-foreground",
                          )}
                        >
                          {resolution.correct === true
                            ? "כן"
                            : resolution.correct === false
                              ? "לא"
                              : "—"}
                        </span>
                      </td>
                      <td className="ltr-isolate whitespace-nowrap">
                        {formatShortDate(market.endDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
