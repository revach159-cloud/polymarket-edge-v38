import { Suspense } from "react";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { MarketCard, MarketsStatsStrip } from "@/components/markets/market-card";
import { MarketFilters } from "@/components/markets/market-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { getMarketStats, getMarkets } from "@/services/markets";
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

  const [result, stats, closedMarkets] = await Promise.all([
    getMarkets(filters),
    getMarketStats(),
    getMarkets({ status: "closed", sort: "endDate" }),
  ]);

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
        <MarketFilters />
      </Suspense>

      {result.data.length === 0 ? (
        <EmptyState
          title="לא נמצאו שווקים שמתאימים למסננים שבחרת."
          description="נסו לאפס מסננים או לחזור מאוחר יותר."
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
            סגירת שוק אינה מעידה על נכונות מודל; תוצאות מוצגות רק לאחר הכרעה.
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
                {closedMarkets.data.slice(0, 10).map((market) => (
                  <tr key={market.id}>
                    <td className="max-w-[28rem] truncate">{market.question}</td>
                    <td className="ltr-isolate">{market.selectedOutcome ?? "—"}</td>
                    <td>טרם הוכרע</td>
                    <td>—</td>
                    <td className="ltr-isolate">{market.endDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
