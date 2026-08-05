import { NextResponse } from "next/server";
import { fetchGammaMarkets } from "@/lib/polymarket/api";

export const dynamic = "force-dynamic";

function assertAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!assertAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { markets, error } = await fetchGammaMarkets({
      limit: 50,
      active: true,
      closed: false,
    });
    return NextResponse.json({
      ok: !error,
      job: "sync-markets",
      marketsFetched: markets.length,
      error: error ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        job: "sync-markets",
        error: e instanceof Error ? e.message : "failed",
      },
      { status: 500 },
    );
  }
}
