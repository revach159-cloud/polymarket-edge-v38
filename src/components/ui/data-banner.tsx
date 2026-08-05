import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function DataBanner({
  stale,
  error,
  fetchedAt,
  source,
  className,
}: {
  stale?: boolean;
  error?: string;
  fetchedAt?: string;
  source?: string;
  className?: string;
}) {
  if (!stale && !error) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        מקור: {sourceLabel(source)}
        {fetchedAt ? (
          <>
            {" · "}
            עודכן{" "}
            <span className="ltr-isolate" dir="ltr">
              {new Date(fetchedAt).toLocaleString("he-IL")}
            </span>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p>
          {error
            ? `לא הצלחנו לעדכן חלק מהנתונים. ${error}`
            : "מוצגים הנתונים האחרונים שנשמרו — ייתכן שהם מעוכבים."}
        </p>
        {fetchedAt ? (
          <p className="mt-1 text-xs opacity-90">
            נתונים אחרונים:{" "}
            <span className="ltr-isolate" dir="ltr">
              {new Date(fetchedAt).toLocaleString("he-IL")}
            </span>
          </p>
        ) : null}
      </div>
      <RefreshCw className="ms-auto h-4 w-4 shrink-0 opacity-70" aria-hidden />
    </div>
  );
}

function sourceLabel(source?: string) {
  switch (source) {
    case "polymarket":
      return "Polymarket (ציבורי)";
    case "supabase":
      return "מסד נתונים";
    case "cache":
      return "מטמון";
    case "empty":
      return "אין נתונים";
    default:
      return source ?? "לא ידוע";
  }
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background-elevated px-6 py-12 text-center">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
