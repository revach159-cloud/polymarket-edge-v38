"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Sparkles, Store, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "בית", icon: Home },
  { href: "/markets", label: "שווקים", icon: Store },
  { href: "/gold", label: "Gold", icon: Sparkles },
  { href: "/wallets", label: "ארנקים", icon: Wallet },
  { href: "/statistics", label: "נתונים", icon: BarChart3 },
];

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
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
