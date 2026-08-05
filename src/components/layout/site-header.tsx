import Link from "next/link";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "בית" },
  { href: "/markets", label: "שווקים" },
  { href: "/gold", label: "Gold" },
  { href: "/wallets", label: "ארנקים" },
  { href: "/statistics", label: "סטטיסטיקה" },
  { href: "/pricing", label: "מנויים" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <Container className="flex h-[var(--nav-height)] items-center justify-between gap-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-primary">
          Polymarket Edge Lab
        </Link>
        <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-foreground-muted hover:bg-muted hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            התחברות
          </Link>
        </nav>
      </Container>
    </header>
  );
}
