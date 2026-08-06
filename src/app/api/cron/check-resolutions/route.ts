import { NextResponse } from "next/server";
import { checkResolutionsJob } from "@/server/jobs/check-resolutions";

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
    const result = await checkResolutionsJob();
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        job: "check-resolutions",
        error: error instanceof Error ? error.message : "job failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
