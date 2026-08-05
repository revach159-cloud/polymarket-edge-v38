import { NextResponse } from "next/server";

export function assertCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (bearer !== secret && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function runCronJob(
  request: Request,
  name: string,
  work: () => Promise<Record<string, unknown>>,
) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const startedAt = new Date().toISOString();
  try {
    const result = await work();
    return NextResponse.json({
      ok: true,
      job: name,
      startedAt,
      completedAt: new Date().toISOString(),
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        job: name,
        startedAt,
        completedAt: new Date().toISOString(),
        error: e instanceof Error ? e.message : "job_failed",
      },
      { status: 500 },
    );
  }
}
