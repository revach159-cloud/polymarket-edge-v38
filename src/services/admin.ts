import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AuditLogEntry } from "@/types";

export async function getAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  return data.map((row) => ({
    id: String(row.id),
    action: row.action,
    actor: row.actor_id ?? undefined,
    target: row.target ?? undefined,
    createdAt: row.created_at,
    meta: row.meta ?? undefined,
  }));
}

export async function getHealthSnapshot() {
  return {
    supabase: isSupabaseConfigured(),
    cronSecret: Boolean(process.env.CRON_SECRET),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
  };
}
