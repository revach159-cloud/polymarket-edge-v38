import { NextResponse } from "next/server";
import { runModelJob } from "@/server/jobs/run-model";
import { HEURISTIC_V1 } from "@/lib/predictions/config";

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
  try {
    const result = await runModelJob();
    return NextResponse.json({
      ...result,
      model: HEURISTIC_V1.name,
      version: HEURISTIC_V1.version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        job: "run-model",
        error: error instanceof Error ? error.message : "job failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
