import { EmptyState } from "@/components/shared/empty-state";
import type { AuditLogEntry } from "@/types";

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  if (!entries.length) {
    return (
      <EmptyState
        title="אין רשומות ביקורת"
        description="יומן הביקורת יופיע כאן כש־Supabase מחובר ונרשמות פעולות."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr className="text-start">
            <th className="px-4 py-3 font-medium">זמן</th>
            <th className="px-4 py-3 font-medium">פעולה</th>
            <th className="px-4 py-3 font-medium">שחקן</th>
            <th className="px-4 py-3 font-medium">יעד</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-border/70">
              <td className="px-4 py-3 ltr-isolate text-xs text-muted-foreground">
                {e.createdAt}
              </td>
              <td className="px-4 py-3 font-medium">{e.action}</td>
              <td className="px-4 py-3 ltr-isolate text-xs">{e.actor ?? "—"}</td>
              <td className="px-4 py-3 ltr-isolate text-xs">{e.target ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
