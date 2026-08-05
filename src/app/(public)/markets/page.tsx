import { Suspense } from "react";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { MarketCard } from "@/components/markets/market-card";
import { MarketFilters } from "@/components/markets/market-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { getMarkets } from "@/services/markets";
import type { MarketFilters as Filters } from "@/types";

export const metadata = { title: "שווקים" };
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

  const result = await getMarkets(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">שווקים</h1>
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

      <Suspense fallback={<LoadingState rows={1} />}>
        <MarketFilters />
      </Suspense>

      {result.data.length === 0 ? (
        <EmptyState
          title="לא נמצאו שווקים שמתאימים למסננים שבחרת."
          description="נסו לאפס מסננים או לחזור מאוחר יותר."
        />
      ) : (
        <div className="grid gap-4">
          {result.data.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}
    </div>
  );
}
