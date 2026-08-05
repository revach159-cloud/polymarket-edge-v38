import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function assertCronAuthorized(request: NextRequest): Promise<Response | null> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET missing" }, { status: 503 });
  }
  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export type JobResult<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  job: string;
  startedAt: string;
  finishedAt: string;
  processed: number;
  message?: string;
  data?: T;
};

export async function withJobLock<T extends Record<string, unknown>>(
  job: string,
  run: () => Promise<{ processed: number; data?: T; message?: string }>,
): Promise<JobResult<T>> {
  const startedAt = new Date().toISOString();
  try {
    const result = await run();
    return {
      ok: true,
      job,
      startedAt,
      finishedAt: new Date().toISOString(),
      processed: result.processed,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    return {
      ok: false,
      job,
      startedAt,
      finishedAt: new Date().toISOString(),
      processed: 0,
      message: error instanceof Error ? error.message : "Job failed",
    };
  }
}
