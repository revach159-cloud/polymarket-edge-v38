import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getSafeRedirectPath } from "@/lib/redirect";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isProtected =
    path.startsWith("/account") ||
    path.startsWith("/admin") ||
    path.startsWith("/onboarding");

  if (isProtected && !user) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", getSafeRedirectPath(path, "/account"));
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/admin") && user) {
    // Role check happens in the page/server — middleware only ensures auth when configured.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
