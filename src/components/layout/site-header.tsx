"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoldWordmark } from "@/components/gold/fire-icon";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const links = [
  { href: "/markets", label: "מודל השווקים" },
  { href: "/wallets", label: "מודל הארנקים" },
  { href: "/wallets/elite", label: "מפלצות" },
  { href: "/wallets/top", label: "Top 10" },
  { href: "/statistics", label: "סטטיסטיקה" },
  { href: "/gold", label: "Gold", gold: true },
  { href: "/pricing", label: "מנויים" },
];

export function SiteHeader({ activeCount }: { activeCount?: number }) {
  const pathname = usePathname();

  return (
    <header className="border-border/70 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <Container className="flex flex-col gap-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-primary text-[11px] font-bold tracking-[0.14em] uppercase">
              POLYMARKET INTELLIGENCE
            </p>
            <Link href="/" className="font-display text-xl font-bold tracking-tight md:text-2xl">
              Polymarket Edge Lab
            </Link>
            <p className="text-muted-foreground mt-0.5 hidden text-sm sm:block">
              האתר המלא · מודל שווקים, ארנקים, דירוגים ו־Gold
            </p>
          </div>
          <div className="flex items-center gap-2">
            {typeof activeCount === "number" ? (
              <span className="border-border bg-background-muted text-muted-foreground hidden rounded-full border px-3 py-1 text-xs md:inline">
                מוכן: {activeCount} פעילים
              </span>
            ) : null}
            <Link href="/login" className="nav-pill">
              התחברות
            </Link>
          </div>
        </div>

        <nav
          aria-label="ניווט ראשי"
          className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {links.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname.startsWith(l.href) && l.href !== "/wallets");
            const walletsActive =
              l.href === "/wallets" &&
              (pathname === "/wallets" || pathname.startsWith("/wallets/"));
            const isActive =
              l.href === "/wallets/top"
                ? pathname.startsWith("/wallets/top")
                : l.href === "/wallets/elite"
                  ? pathname.startsWith("/wallets/elite")
                  : l.href === "/wallets"
                    ? walletsActive &&
                      !pathname.startsWith("/wallets/top") &&
                      !pathname.startsWith("/wallets/elite")
                    : active;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "nav-pill shrink-0",
                  l.gold && "nav-pill-gold",
                  l.gold && isActive && "nav-pill-gold-active",
                  isActive && !l.gold && "nav-pill-active",
                )}
              >
                {l.gold ? <GoldWordmark size="xs" /> : l.label}
              </Link>
            );
          })}
        </nav>
      </Container>
    </header>
  );
}
