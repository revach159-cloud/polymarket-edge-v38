import { NextResponse } from "next/server";
import { getAppVersion, isSupabaseConfigured } from "@/lib/env";
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
    polymarket,
    lastSuccessfulSync: null,
    timestamp: new Date().toISOString(),
  });
}
