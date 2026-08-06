import Link from "next/link";
import { Suspense } from "react";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { MarketCard, MarketsStatsStrip } from "@/components/markets/market-card";
import { MarketFilters } from "@/components/markets/market-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { recordedPredictionSides } from "@/lib/history/prediction-store";
import { summarizeClosedMarkets } from "@/lib/markets/closed-stats";
import { formatOutcomeLabel } from "@/lib/markets/outcome-label";
import { computeMarketStats } from "@/lib/markets/stats";
import { formatShortDate, cn } from "@/lib/utils";
import { getMarkets } from "@/services/markets";
import type { MarketFilters as Filters } from "@/types";

export const metadata = { title: "מודל השווקים" };
export const dynamic = "force-dynamic";

const CLOSED_PAGE_SIZE = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pageHref(base: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(base)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("closedPage", String(page));
  else params.delete("closedPage");
  const qs = params.toString();
  return qs ? `/markets?${qs}#closed-stats` : "/markets#closed-stats";
}

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const requestedStatus = (
    typeof sp.status === "string" ? sp.status : "active"
  ) as Filters["status"];
  // Closed predictions belong in the stats table only — never as the main card grid.
  const showingClosedTab = requestedStatus === "closed";
  const filters: Filters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    sort: (typeof sp.sort === "string" ? sp.sort : "smart") as Filters["sort"],
    status: showingClosedTab ? "active" : requestedStatus,
    category: typeof sp.category === "string" ? sp.category : undefined,
    horizon: (typeof sp.horizon === "string" ? sp.horizon : "all") as Filters["horizon"],
  };

  const closedPageRaw = typeof sp.closedPage === "string" ? Number(sp.closedPage) : 1;
  const closedPage = Number.isFinite(closedPageRaw) && closedPageRaw > 0
    ? Math.floor(closedPageRaw)
    : 1;

  const [result, closedMarkets, activeForStats] = await Promise.all([
    getMarkets(filters),
    getMarkets({ status: "closed", sort: "endDate", qualityOnly: false }),
    filters.status === "active" && !filters.q && !filters.category && filters.horizon === "all"
      ? Promise.resolve(null)
      : getMarkets({ status: "active", sort: "smart" }),
  ]);

  const predictedSides = recordedPredictionSides();
  const closedSummary = summarizeClosedMarkets(closedMarkets.data, predictedSides, {
    fallbackToLivePick: false,
  });
  const stats = computeMarketStats(
    activeForStats?.data ?? result.data,
    closedMarkets.data,
    predictedSides,
  );

  const totalClosedPages = Math.max(
    1,
    Math.ceil(closedSummary.verdicts.length / CLOSED_PAGE_SIZE),
  );
  const safeClosedPage = Math.min(closedPage, totalClosedPages);
  const closedSlice = closedSummary.verdicts.slice(
    (safeClosedPage - 1) * CLOSED_PAGE_SIZE,
    safeClosedPage * CLOSED_PAGE_SIZE,
  );

  const pageQuery = {
    status: showingClosedTab ? "closed" : filters.status,
    sort: filters.sort,
    q: filters.q,
    category: filters.category,
    horizon: filters.horizon === "all" ? undefined : filters.horizon,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">מודל השווקים</h1>
          <p className="mt-1 text-muted-foreground">
            250+ פרדיקשנים איכותיים ביום · דגש על סגירה בעוד שעתיים ו־5 שעות · סבירות גבוהה
            לניצחון
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

      <div className="flex flex-wrap gap-2">
        <Link
          href="/markets?status=active&sort=smart"
          className={cn(
            "nav-pill",
            !showingClosedTab && filters.horizon === "all" && "nav-pill-active",
          )}
        >
          פעילים
        </Link>
        <Link
          href="/markets?horizon=2h&sort=endDate"
          className={cn("nav-pill", filters.horizon === "2h" && "nav-pill-active")}
        >
          עד שעתיים
        </Link>
        <Link
          href="/markets?horizon=5h&sort=endDate"
          className={cn("nav-pill", filters.horizon === "5h" && "nav-pill-active")}
        >
          עד 5 שעות
        </Link>
        <Link
          href="/markets?status=closed#closed-stats"
          className={cn("nav-pill", showingClosedTab && "nav-pill-active")}
        >
          סגורים לסטטיסטיקה
        </Link>
        <Link href="/statistics" className="nav-pill">
          היסטוריה וסטטיסטיקה
        </Link>
      </div>

      {!showingClosedTab ? (
        <>
          <Suspense fallback={<LoadingState rows={1} />}>
            <MarketFilters resultCount={result.data.length} />
          </Suspense>

          {result.data.length === 0 ? (
            <EmptyState
              title="לא נמצאו שווקים שמתאימים למסננים שבחרת."
              description="נסו חיפוש חופשי (למשל crypto / ספורט) או איפוס מסננים."
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
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          פרדיקשנים סגורים לא מוצגים ככרטיסים ברשימה — רק בטבלת הסטטיסטיקה למטה
          ({closedSummary.closed} סגורים).
        </div>
      )}

      <section id="closed-stats" className="scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold">שווקים שנסגרו · מסונכרן לסטטיסטיקה</h2>
            <p className="text-sm text-muted-foreground">
              צדקנו ואחוז הצלחה נספרים מאותה רשימה. בחירה מוצגת כ־Yes/No בלבד.
            </p>
          </div>
          <Link
            href="#closed-stats"
            className="text-sm font-semibold text-primary hover:underline"
          >
            לראש הטבלה
          </Link>
        </div>
        {closedSummary.verdicts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            אין שווקים סגורים במשיכה הנוכחית.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              סיכום סגורים:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                נסגרו {closedSummary.closed}
              </span>
              {" · "}
              {closedSummary.evaluable > 0 ? (
                <>
                  <span className="font-semibold tabular-nums">
                    <span className="stat-chip-value-glow">
                      צדקנו {closedSummary.correct}
                    </span>
                    <span className="text-foreground">
                      {" "}
                      מתוך {closedSummary.evaluable} מוכרעים
                    </span>
                  </span>
                  {" · "}
                  <span className="font-semibold text-foreground tabular-nums">
                    אחוז הצלחה{" "}
                    {`${Math.round((closedSummary.correct / closedSummary.evaluable) * 100)}%`}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-foreground">
                  אין מדגם אמיתי עדיין
                </span>
              )}
              {" · "}
              עמוד {safeClosedPage} מתוך {totalClosedPages}
            </p>
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
                  {closedSlice.map((verdict) => {
                    const { market, predictedSide, resolution, correct } = verdict;
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
                        <td className="ltr-isolate">
                          {formatOutcomeLabel(predictedSide)}
                        </td>
                        <td>
                          <span className="ltr-isolate" dir="ltr">
                            {formatOutcomeLabel(resolution.label)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={cn(
                              "font-semibold",
                              correct === true && "text-success",
                              correct === false && "text-destructive",
                              correct == null && "text-muted-foreground",
                            )}
                          >
                            {correct === true ? "כן" : correct === false ? "לא" : "—"}
                          </span>
                        </td>
                        <td className="ltr-isolate whitespace-nowrap">
                          {formatShortDate(market.endDate ?? market.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalClosedPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={pageHref(pageQuery, Math.max(1, safeClosedPage - 1))}
                  className={cn(
                    "nav-pill",
                    safeClosedPage <= 1 && "pointer-events-none opacity-40",
                  )}
                  aria-disabled={safeClosedPage <= 1}
                >
                  הקודם
                </Link>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: totalClosedPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalClosedPages <= 7) return true;
                      return (
                        page === 1 ||
                        page === totalClosedPages ||
                        Math.abs(page - safeClosedPage) <= 1
                      );
                    })
                    .map((page, index, arr) => {
                      const prev = arr[index - 1];
                      const needsEllipsis = prev != null && page - prev > 1;
                      return (
                        <span key={page} className="contents">
                          {needsEllipsis ? (
                            <span className="px-1 text-muted-foreground">…</span>
                          ) : null}
                          <Link
                            href={pageHref(pageQuery, page)}
                            className={cn(
                              "nav-pill min-w-10 justify-center",
                              page === safeClosedPage && "nav-pill-active",
                            )}
                          >
                            {page}
                          </Link>
                        </span>
                      );
                    })}
                </div>
                <Link
                  href={pageHref(pageQuery, Math.min(totalClosedPages, safeClosedPage + 1))}
                  className={cn(
                    "nav-pill",
                    safeClosedPage >= totalClosedPages && "pointer-events-none opacity-40",
                  )}
                  aria-disabled={safeClosedPage >= totalClosedPages}
                >
                  הבא
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
