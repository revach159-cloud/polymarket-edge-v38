"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Edge Lab chrome for non-academy routes.
 * Academy routes render their own shell via `src/app/academy/layout.tsx`.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAcademy = pathname === "/academy" || pathname.startsWith("/academy/");

  if (isAcademy) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:pb-10"
      >
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
