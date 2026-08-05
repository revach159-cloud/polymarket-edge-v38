"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Crown,
  Layers,
  Settings,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "חשבון", icon: Settings },
  { href: "/markets", label: "שווקים", icon: Layers },
  { href: "/gold", label: "Gold", icon: Crown },
  { href: "/wallets", label: "ארנקים", icon: Wallet },
  { href: "/statistics", label: "סטטיסטיקה", icon: BarChart3 },
  { href: "/admin", label: "ניהול", icon: Activity, adminOnly: true },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav
        className="sticky top-20 space-y-1 rounded-xl border border-border/80 bg-card p-3"
        aria-label="תפריט צד"
      >
        {visible.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                href === "/gold" && !active && "text-gold/80",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
