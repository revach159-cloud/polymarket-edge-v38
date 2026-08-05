import { NextResponse } from "next/server";

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
  return NextResponse.json({
    ok: true,
    job: "check-resolutions",
    processed: 0,
    timestamp: new Date().toISOString(),
  });
}
