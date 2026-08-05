"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ChartInner = dynamic(
  () =>
    import("@/components/markets/price-chart-inner").then(
      (m) => m.PriceChartInner,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
  },
);

export function PriceChart({
  points,
  label = "מחיר",
}: {
  points: { t: number; p: number }[];
  label?: string;
}) {
  if (!points.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        אין היסטוריית מחירים להצגה
      </div>
    );
  }

  return <ChartInner points={points} label={label} />;
}
