import { NextResponse } from "next/server";

/** Alias to /auth/callback for route-group path /callback */
export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/auth/callback";
  return NextResponse.redirect(url);
}
