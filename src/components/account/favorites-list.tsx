import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import type { Market } from "@/types";

export function FavoritesList({ markets }: { markets: Market[] }) {
  if (!markets.length) {
    return (
      <EmptyState
        title="אין מועדפים עדיין"
        description="סמנו שווקים כמועדפים ממסך השוק לאחר התחברות."
        action={
          <Link href="/markets" className="text-sm text-primary hover:underline">
            לעמוד השווקים
          </Link>
        }
      />
    );
  }

  return (
    <ul className="space-y-3">
      {markets.map((m) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="min-w-0 space-y-1">
            <Link
              href={`/markets/${m.slug}`}
              className="font-medium hover:text-primary"
            >
              <span className="line-clamp-2 ltr-isolate">{m.question}</span>
            </Link>
            {m.category ? <Badge variant="muted">{m.category}</Badge> : null}
          </div>
          <Link
            href={`/markets/${m.slug}`}
            className="text-sm text-primary hover:underline"
          >
            פרטים
          </Link>
        </li>
      ))}
    </ul>
  );
}
