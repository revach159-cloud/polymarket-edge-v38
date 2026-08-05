import { redirect } from "next/navigation";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { HealthPanel } from "@/components/admin/health-panel";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { getAuditLog, getHealthSnapshot } from "@/services/admin";
import { requireAdmin } from "@/services/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "ניהול" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PermissionDenied
        title="ניהול לא זמין"
        description="יש להגדיר Supabase ותפקיד מנהל כדי לגשת ללוח הניהול."
      />
    );
  }

  const admin = await requireAdmin();
  if (!admin) {
    redirect("/account?denied=admin");
  }

  const [health, audit] = await Promise.all([
    getHealthSnapshot(),
    getAuditLog(40),
  ]);

  const system = {
    gamma: "ok" as const,
    clob: "ok" as const,
    supabase: isSupabaseConfigured() ? ("ok" as const) : ("missing" as const),
    lastCheckedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">לוח ניהול</h1>
        <p className="mt-1 text-muted-foreground">בריאות מערכת ויומן ביקורת</p>
      </div>
      <HealthPanel health={health} system={system} />
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">יומן ביקורת</h2>
        <AuditLogTable entries={audit} />
      </section>
    </div>
  );
}
