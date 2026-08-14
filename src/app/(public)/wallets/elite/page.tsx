import Link from "next/link";
import { Container } from "@/components/layout/container";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { eliteLossLabelHe, formatProfitFactor, walletDisplayName } from "@/lib/wallets/elite";
import { formatPercent, formatUsd, truncateAddress } from "@/lib/utils";
import { getEliteWallets } from "@/services/wallets";
import type { EliteWallet } from "@/types";

export const metadata = {
  title: "ארנקים עם רווחים משוגעים",
};
export const maxDuration = 60;

function windowLabel(window: EliteWallet["window"]): string {
  return window === "month" ? "30 יום" : "כל הזמנים";
}

function lossBadgeVariant(label: EliteWallet["lossLabel"]) {
  if (label === "none") return "gold" as const;
  if (label === "tiny") return "success" as const;
  return "secondary" as const;
}

export default async function EliteWalletsPage() {
  const result = await getEliteWallets();

  return (
    <main id="main-content" className="pb-10">
      <Container className="space-y-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">ארנקים עם רווחים משוגעים</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              דירוג ציבורי של ארנקים עם PnL גבוה, שיעור ניצחון גבוה, וגורם רווח גבוה — כמעט בלי
              הפסדים בדגימת פוזיציות סגורות. ארנקים שיושבים על הפסדים פתוחים גדולים מסוננים החוצה.
            </p>
          </div>
          <DataFreshnessBadge
            fetchedAt={result.fetchedAt}
            stale={result.stale}
            source={result.source}
          />
        </div>

        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">PnL ≥ $20K</Badge>
          <Badge variant="outline">ניצחונות ≥ 68%</Badge>
          <Badge variant="outline">גורם רווח ≥ 4</Badge>
          <Badge variant="outline">חלק הפסדים ≤ 16%</Badge>
          <Badge variant="outline">מדגם ≥ 8 פוזיציות סגורות</Badge>
        </div>

        {result.stale || result.error ? <StaleBanner message={result.error} /> : null}

        {result.data.length === 0 ? (
          <EmptyState
            title="אין כרגע ארנקי מפלצות להצגה"
            description={result.error ?? "נסו שוב מאוחר יותר — הרף מחמיר בכוונה."}
            action={
              <Button asChild variant="outline">
                <Link href="/wallets/top">ללוח המובילים הרגיל</Link>
              </Button>
            }
          />
        ) : (
          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="text-start">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">ארנק</th>
                  <th className="px-4 py-3 font-medium">PnL</th>
                  <th className="px-4 py-3 font-medium">ניצחונות</th>
                  <th className="px-4 py-3 font-medium">גורם רווח</th>
                  <th className="px-4 py-3 font-medium">הפסדים</th>
                  <th className="px-4 py-3 font-medium">מדגם</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((w) => {
                  const name = walletDisplayName(w.userName, w.address);
                  const shortName = name === w.address ? truncateAddress(w.address, 4) : name;
                  return (
                    <tr key={w.address} className="border-border/70 border-t">
                      <td className="px-4 py-3 tabular-nums">{w.rank ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/wallets/${w.address}`}
                          className="text-primary font-medium hover:underline"
                        >
                          {shortName}
                        </Link>
                        <p className="text-muted-foreground ltr-isolate mt-0.5 font-mono text-[11px]">
                          {truncateAddress(w.address, 6)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          {windowLabel(w.window)}
                          {w.roi != null ? ` · ROI ${formatPercent(w.roi, 1)}` : ""}
                        </p>
                      </td>
                      <td className="text-success px-4 py-3 tabular-nums">
                        {w.pnl != null ? formatUsd(w.pnl, 0) : "—"}
                        {w.openUnrealizedLoss > 1_000 ? (
                          <p className="text-risk mt-1 text-[11px]">
                            פתוח −{formatUsd(w.openUnrealizedLoss, 0)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {w.winRate != null ? formatPercent(w.winRate, 0) : "—"}
                        {w.wilsonLowerBound != null ? (
                          <p className="text-muted-foreground text-[11px]">
                            Wilson {formatPercent(w.wilsonLowerBound, 0)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatProfitFactor(w.profitFactor)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={lossBadgeVariant(w.lossLabel)}>
                          {eliteLossLabelHe(w.lossLabel)}
                        </Badge>
                        <p className="text-muted-foreground mt-1 text-[11px] tabular-nums">
                          {formatPercent(w.lossShare, 1)} מהסכום
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {w.wins}/{w.sampleSize}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-muted-foreground text-xs">
          הדגימה היא עד 50 פוזיציות סגורות אחרונות מ־Polymarket Data API, בתוספת בדיקת הפסדים
          פתוחים. זה אינו ייעוץ פיננסי ואינו הבטחת רווח — ביצועי עבר לא חוזים את העתיד.
        </p>
      </Container>
    </main>
  );
}
