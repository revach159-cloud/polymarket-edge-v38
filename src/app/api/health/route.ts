import { NextResponse } from "next/server";
import {
  getAppVersion,
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { probeClob, probeGamma } from "@/lib/polymarket/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const [gamma, clob] = await Promise.all([probeGamma(), probeClob()]);
  const polymarket =
    gamma === "ok" && clob === "ok"
      ? "available"
      : gamma === "down" && clob === "down"
        ? "unavailable"
        : "degraded";

  const status =
    polymarket === "unavailable" && !isSupabaseConfigured() ? "degraded" : "ok";

  return NextResponse.json({
    status,
    version: getAppVersion(),
    database: isSupabaseConfigured() ? "configured" : "not_configured",
    // Supabase service role OR committed public/prediction-history.json.
    historyDurable: isServiceRoleConfigured()
      ? "supabase"
      : "static_or_live_fallback",
    polymarket,
    lastSuccessfulSync: null,
    timestamp: new Date().toISOString(),
  });
}
