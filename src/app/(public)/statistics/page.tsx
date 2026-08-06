import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { MarketsStatsStrip } from "@/components/markets/market-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordedPredictionSides } from "@/lib/history/prediction-store";
import { summarizeClosedMarkets } from "@/lib/markets/closed-stats";
import { formatPredictionLabel } from "@/lib/markets/outcome-label";
import { formatShortDate, cn } from "@/lib/utils";
import { getMarketStats, getMarkets } from "@/services/markets";

export const metadata = { title: "סטטיסטיקה" };
export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const [stats, markets, closedMarkets] = await Promise.all([
    getMarketStats(),
    getMarkets({ status: "active", sort: "volume" }),
    getMarkets({ status: "closed", sort: "endDate", qualityOnly: false }),
  ]);

  const closedSummary = summarizeClosedMarkets(
    closedMarkets.data,
    recordedPredictionSides(),
    { fallbackToLivePick: false, trackedOnly: true },
  );
  const resolvedRows = closedSummary.verdicts.filter((v) => v.correct !== null);

  const sampleSize = markets.data.length;
  const categories = markets.data.reduce<Record<string, number>>((acc, m) => {
    const key = m.category || "אחר";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">סטטיסטיקה</h1>
          <p className="mt-1 text-muted-foreground">מדדי פעילות ותוצאות מוכרעות בלבד</p>
        </div>
        <DataFreshnessBadge
          fetchedAt={markets.fetchedAt}
          stale={markets.stale}
          source={markets.source}
        />
      </div>

      <MarketsStatsStrip {...stats} />

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold">תוצאות מוכרעות</h2>
          <p className="text-sm text-muted-foreground">
            אותם סגורים כמו במודל השווקים · צדקנו ואחוז הצלחה מסונכרנים לאותו מדגם.
          </p>
        </div>
        {resolvedRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            עדיין אין פרדיקשנים מוכרעים במדגם. שיעור הצלחה יוצג רק לאחר שפרדיקשנים
            שנרשמו בזמן פעילות יסגרו ויוכרעו.
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
                {resolvedRows.map((verdict) => (
                  <tr key={verdict.market.id}>
                    <td className="max-w-[28rem] truncate">
                      <span className="ltr-isolate" dir="ltr">
                        {verdict.market.question}
                      </span>
                    </td>
                    <td className="ltr-isolate">
                      {formatPredictionLabel(
                        verdict.market,
                        verdict.predictedSide,
                      )}
                    </td>
                    <td className="ltr-isolate">{verdict.resolution.label}</td>
                    <td
                      className={cn(
                        "font-semibold",
                        verdict.correct ? "text-success" : "text-destructive",
                      )}
                    >
                      {verdict.correct ? "כן" : "לא"}
                    </td>
                    <td className="ltr-isolate">
                      {formatShortDate(
                        verdict.market.endDate ?? verdict.market.updatedAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>התפלגות קטגוריות (מדגם n={sampleSize})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין נתונים במדגם.</p>
          ) : (
            topCategories.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (count / Math.max(sampleSize, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        אחוזי הצלחה יוצגו רק אחרי צבירת פרדיקשנים שהוכרעו בפועל, תמיד עם גודל
        מדגם מפורש ומסונכרן לרשימת הסגורים.
      </p>

      <DisclaimerBanner compact />
    </div>
  );
}
