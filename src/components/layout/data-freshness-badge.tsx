import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DataFreshnessBadge({
  fetchedAt,
  stale,
  source,
}: {
  fetchedAt: string;
  stale?: boolean;
  source?: string;
}) {
  const relative = formatDistanceToNow(new Date(fetchedAt), {
    addSuffix: true,
    locale: he,
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={stale ? "warning" : "muted"} className="cursor-help font-normal">
            {stale ? "נתונים ישנים" : "מעודכן"} · {relative}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            נמשך {relative}
            {source ? ` · מקור: ${source}` : ""}
          </p>
          <p className="ltr-isolate mt-1 opacity-80">{fetchedAt}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
