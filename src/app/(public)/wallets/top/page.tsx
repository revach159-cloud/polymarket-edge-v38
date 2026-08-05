import Link from "next/link";
import { Container } from "@/components/layout/container";
import { DataFreshnessBadge } from "@/components/layout/data-freshness-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StaleBanner } from "@/components/shared/stale-banner";
import { formatUsd, truncateAddress } from "@/lib/utils";
import { getTopWallets } from "@/services/wallets";

export const metadata = {
  title: "ארנקים מובילים",
};

export default async function TopWalletsPage() {
  const result = await getTopWallets(25);

  return (
    <main id="main-content" className="pb-10">
      <Container className="space-y-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">ארנקים מובילים</h1>
            <p className="mt-1 text-muted-foreground">
              דירוג ציבורי — נתונים עשויים להיות חלקיים
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

        {result.data.length === 0 ? (
          <EmptyState
            title="לוח המובילים אינו זמין"
            description={result.error ?? "נסו שוב מאוחר יותר."}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr className="text-start">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">כתובת</th>
                  <th className="px-4 py-3 font-medium">PnL</th>
                  <th className="px-4 py-3 font-medium">נפח</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((w) => (
                  <tr key={w.address} className="border-t border-border/70">
                    <td className="px-4 py-3 tabular-nums">{w.rank ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/wallets/${w.address}`}
                        className="font-mono text-primary hover:underline ltr-isolate"
                      >
                        {truncateAddress(w.address, 6)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {w.pnl != null ? formatUsd(w.pnl, 0) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {w.volume != null ? formatUsd(w.volume, 0) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </main>
  );
}
