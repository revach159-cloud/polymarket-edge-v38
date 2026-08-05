import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatUsd } from "@/lib/utils";
import { getMarketStats, getMarkets } from "@/services/markets";

export const metadata = { title: "סטטיסטיקה" };
export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const [stats, markets] = await Promise.all([
    getMarketStats(),
    getMarkets({ status: "active", sort: "volume" }),
  ]);

  const sampleSize = markets.data.length;
  const categories = markets.data.reduce<Record<string, number>>((acc, m) => {
    const key = m.category || "אחר";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const goldCount = markets.data.filter((m) => m.goldPick).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">סטטיסטיקה</h1>
          <p className="mt-1 text-muted-foreground">
            סיכום מדגם שווקים פעילים — ללא אחוזי הצלחה מדומים
          </p>
        </div>
        <DataFreshnessBadge
          fetchedAt={markets.fetchedAt}
          stale={markets.stale}
          source={markets.source}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              גודל מדגם
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {formatNumber(sampleSize)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              שווקים במשיכה הנוכחית
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">נפח</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {formatUsd(stats.volume)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">נזילות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {formatUsd(stats.liquidity)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              מועמדי Gold במדגם
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {formatNumber(goldCount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              מתוך {formatNumber(sampleSize)} — לא אחוז ניצחון
            </p>
          </CardContent>
        </Card>
      </div>

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
        מדגם מפורש.
      </p>

      <DisclaimerBanner compact />
    </div>
  );
}
