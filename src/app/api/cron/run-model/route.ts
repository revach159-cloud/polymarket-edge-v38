import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function assertAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!assertAuth(request)) return unauthorized();
  return NextResponse.json({
    ok: true,
    job: "run-model",
    model: "heuristic-v1",
    version: "1.0.0",
    predictionsCreated: 0,
    timestamp: new Date().toISOString(),
  });
}
