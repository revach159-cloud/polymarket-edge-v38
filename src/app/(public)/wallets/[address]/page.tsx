import Link from "next/link";
import { Container } from "@/components/layout/container";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd, truncateAddress } from "@/lib/utils";
import { getWalletDetail } from "@/services/wallets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return { title: truncateAddress(address) };
}

export default async function WalletDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const result = await getWalletDetail(address);

  return (
    <main id="main-content" className="pb-10">
      <Container className="space-y-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">ארנק</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground ltr-isolate">
              {address}
            </p>
          </div>
          <DataFreshnessBadge
            fetchedAt={result.fetchedAt}
            stale={result.stale}
            source={result.source}
          />
        </div>

        {result.stale || result.error ? (
          <StaleBanner message={result.error} />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>פעילות אחרונה</CardTitle>
          </CardHeader>
          <CardContent>
            {result.data.trades.length === 0 ? (
              <EmptyState
                title="אין פעילות להצגה"
                description="ייתכן שהכתובת אינה פעילה או שה־API אינו זמין."
              />
            ) : (
              <ul className="divide-y divide-border">
                {result.data.trades.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={t.side === "BUY" ? "success" : "risk"}>
                          {t.side}
                        </Badge>
                        {t.marketSlug ? (
                          <Link
                            href={`/markets/${t.marketSlug}`}
                            className="hover:text-primary"
                          >
                            {t.marketQuestion ?? t.marketSlug}
                          </Link>
                        ) : (
                          <span>{t.marketQuestion ?? "עסקה"}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground ltr-isolate">
                        {t.timestamp}
                      </p>
                    </div>
                    <div className="text-end tabular-nums">
                      <p>{formatUsd(t.size * t.price, 2)}</p>
                      <p className="text-xs text-muted-foreground">
                        @ {(t.price * 100).toFixed(1)}%
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
