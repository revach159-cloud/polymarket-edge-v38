"use client";

import { useEffect, useState } from "react";
import { differenceInSeconds, formatDistanceStrict } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function Countdown({
  endDate,
  className,
}: {
  endDate: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const end = new Date(endDate);
  const seconds = differenceInSeconds(end, now);

  if (Number.isNaN(end.getTime())) return null;

  if (seconds <= 0) {
    return <span className={cn("text-muted-foreground", className)}>הסתיים</span>;
  }

  return (
    <span className={cn("tabular-nums text-muted-foreground", className)} title={endDate}>
      נותר {formatDistanceStrict(end, now, { locale: he })}
    </span>
  );
}
