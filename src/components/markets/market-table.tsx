import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatUsd } from "@/lib/utils";
import type { Market } from "@/types";

export function MarketTable({ markets }: { markets: Market[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr className="text-start">
            <th className="px-4 py-3 font-medium">שוק</th>
            <th className="px-4 py-3 font-medium">Yes</th>
            <th className="px-4 py-3 font-medium">איכות</th>
            <th className="px-4 py-3 font-medium">נפח</th>
            <th className="px-4 py-3 font-medium">נזילות</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => (
            <tr
              key={m.id}
              className="border-t border-border/70 hover:bg-muted/30"
            >
              <td className="max-w-md px-4 py-3">
                <Link
                  href={`/markets/${m.slug}`}
                  className="font-medium hover:text-primary"
                >
                  <span className="line-clamp-2 ltr-isolate">{m.question}</span>
                </Link>
                {m.goldPick ? (
                  <Badge variant="gold" className="mt-1">
                    Gold
                  </Badge>
                ) : null}
              </td>
              <td className="px-4 py-3 tabular-nums text-success">
                {formatPercent(
                  m.marketProbability ?? m.outcomes[0]?.price ?? 0,
                )}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {m.qualityScore != null ? m.qualityScore.toFixed(0) : "—"}
              </td>
              <td className="px-4 py-3 tabular-nums">{formatUsd(m.volume)}</td>
              <td className="px-4 py-3 tabular-nums">
                {formatUsd(m.liquidity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
