"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Store, Wallet } from "lucide-react";
import { FireIcon } from "@/components/gold/fire-icon";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "בית", icon: Home },
  { href: "/markets", label: "מודל", icon: Store },
  { href: "/gold", label: "Gold", gold: true },
  { href: "/wallets", label: "ארנקים", icon: Wallet },
  { href: "/statistics", label: "סטטיסטיקה", icon: BarChart3 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md md:hidden"
      aria-label="ניווט תחתון"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid h-[var(--bottom-nav-height)] max-w-lg grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const isGold = "gold" in item && item.gold;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-[11px]",
                  isGold
                    ? active
                      ? "text-gold"
                      : "text-gold/75"
                    : active
                      ? "text-primary"
                      : "text-muted-foreground",
                )}
              >
                {isGold ? (
                  <FireIcon size="sm" className="fire-icon--nav-bottom" />
                ) : "icon" in item ? (
                  <item.icon className="h-5 w-5" aria-hidden />
                ) : null}
                <span className={cn(isGold && "font-semibold text-gold")}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
