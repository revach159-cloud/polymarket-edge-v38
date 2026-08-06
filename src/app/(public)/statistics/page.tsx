import Link from "next/link";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { MarketsStatsStrip } from "@/components/markets/market-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatShortDate, formatUsd, cn } from "@/lib/utils";
import { getWalletPlaybook } from "@/lib/wallets/intelligence";
import {
  getMarketStats,
  getMarkets,
  getResolvedPredictions,
} from "@/services/markets";

export const metadata = { title: "סטטיסטיקה" };
export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const [stats, markets, closedMarkets, resolvedPredictions, playbook] =
    await Promise.all([
      getMarketStats(),
      getMarkets({ status: "active", sort: "smart" }),
      getMarkets({ status: "closed", sort: "endDate" }),
      getResolvedPredictions(50),
      getWalletPlaybook({ walletLimit: 8, activityLimit: 30 }),
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

  const correct = resolvedPredictions.filter((p) => p.correct).length;
  const decided = resolvedPredictions.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">סטטיסטיקה</h1>
          <p className="mt-1 text-muted-foreground">
            היסטוריית הכרעות מסונכרנת + תובנות מארנקים החזקים ב־Polymarket
          </p>
        </div>
        <DataFreshnessBadge
          fetchedAt={markets.fetchedAt}
          stale={markets.stale}
          source={markets.source}
        />
      </div>

      <MarketsStatsStrip {...stats} />

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>מדגם מוכרע</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{decided}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              פרדיקשנים עם תוצאה ברורה מהשווקים הסגורים
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>צדקנו</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-primary">{correct}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {decided
                ? `${Math.round((correct / decided) * 100)}% הצלחה · n=${decided}`
                : "ממתין להכרעות"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>סגורים שנמשכו</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{closedMarkets.data.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link href="/markets?status=closed&sort=endDate" className="text-primary hover:underline">
                פתיחת רשימת הסגורים
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold">איך הארנקים החזקים מנצחים</h2>
          <p className="text-sm text-muted-foreground">
            ניתוח חי מלוח המובילים ופעילות המסחר האחרונה שלהם — משמש גם למיון החכם בשווקים.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>תובנות מפתח</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {playbook.insights.map((insight) => (
                <p key={insight}>• {insight}</p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>טווחי מחיר בכניסה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(playbook.priceBucketShares).map(([label, share]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatPercent(share, 0)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${Math.round(share * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="data-table overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ארנק</th>
                <th>PnL</th>
                <th>נפח</th>
                <th>קניות אחרונות</th>
                <th>מחיר כניסה ממוצע</th>
              </tr>
            </thead>
            <tbody>
              {playbook.topWallets.map((wallet) => (
                <tr key={wallet.address}>
                  <td>{wallet.rank ?? "—"}</td>
                  <td>
                    <Link
                      href={`/wallets/${wallet.address}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      <span className="ltr-isolate" dir="ltr">
                        {wallet.userName || `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`}
                      </span>
                    </Link>
                  </td>
                  <td className="ltr-isolate tabular-nums">
                    {wallet.pnl != null ? formatUsd(wallet.pnl, 0) : "—"}
                  </td>
                  <td className="ltr-isolate tabular-nums">
                    {wallet.volume != null ? formatUsd(wallet.volume, 0) : "—"}
                  </td>
                  <td className="tabular-nums">{wallet.recentBuys}</td>
                  <td className="ltr-isolate tabular-nums">
                    {wallet.avgEntryPrice != null
                      ? formatPercent(wallet.avgEntryPrice)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold">תוצאות מוכרעות (היסטוריה חיה)</h2>
          <p className="text-sm text-muted-foreground">
            Win Rate מופיע רק לפרדיקשנים שהוכרעו בפועל, עם גודל המדגם. הנתונים מסונכרנים משווקים סגורים.
          </p>
        </div>
        {resolvedPredictions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            עדיין אין פרדיקשנים מוכרעים במדגם. פתחו את{" "}
            <Link href="/markets?status=closed" className="text-primary hover:underline">
              השווקים הסגורים
            </Link>{" "}
            כדי להתחיל לסנכרן הכרעות.
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
                {resolvedPredictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td className="max-w-[28rem]">
                      {prediction.slug ? (
                        <Link
                          href={`/markets/${prediction.slug}`}
                          className="line-clamp-2 hover:text-primary hover:underline"
                        >
                          <span className="ltr-isolate" dir="ltr">
                            {prediction.marketQuestion}
                          </span>
                        </Link>
                      ) : (
                        <span className="ltr-isolate" dir="ltr">
                          {prediction.marketQuestion}
                        </span>
                      )}
                    </td>
                    <td className="ltr-isolate">{prediction.side}</td>
                    <td className="ltr-isolate">
                      {prediction.resolvedOutcome ?? "הוכרע"}
                    </td>
                    <td
                      className={cn(
                        "font-semibold",
                        prediction.correct ? "text-success" : "text-destructive",
                      )}
                    >
                      {prediction.correct ? "כן" : "לא"}
                    </td>
                    <td className="ltr-isolate">
                      {formatShortDate(prediction.resolvedAt)}
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
          <CardTitle>התפלגות קטגוריות פעילות (מדגם n={sampleSize})</CardTitle>
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
        אחוזי הצלחה מוצגים תמיד עם גודל מדגם מפורש. קונצנזוס הארנקים משפיע על המיון החכם ועל ציון המודל, אך אינו הבטחת רווח.
      </p>

      <DisclaimerBanner compact />
    </div>
  );
}
