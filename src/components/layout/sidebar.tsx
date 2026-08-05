"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Layers,
  Settings,
  Wallet,
} from "lucide-react";
import { FireIcon } from "@/components/gold/fire-icon";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "חשבון", icon: Settings },
  { href: "/markets", label: "שווקים", icon: Layers },
  { href: "/gold", label: "Gold", gold: true },
  { href: "/wallets", label: "ארנקים", icon: Wallet },
  { href: "/statistics", label: "סטטיסטיקה", icon: BarChart3 },
  { href: "/admin", label: "ניהול", icon: Activity, adminOnly: true },
] as const;

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !("adminOnly" in i && i.adminOnly) || isAdmin);

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav
        className="sticky top-20 space-y-1 rounded-xl border border-border/80 bg-card p-3"
        aria-label="תפריט צד"
      >
        {visible.map((item) => {
          const { href, label } = item;
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          const isGold = "gold" in item && item.gold;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                isGold
                  ? active
                    ? "bg-gold/15 text-gold"
                    : "text-gold/80 hover:bg-gold/10 hover:text-gold"
                  : active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {isGold ? (
                <FireIcon size="xs" />
              ) : "icon" in item ? (
                <item.icon className="h-4 w-4" aria-hidden />
              ) : null}
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
