import Link from "next/link";
import { academyTokens } from "@/lib/academy/design/tokens";

const nav = [
  { href: "/academy", label: "בית האקדמיה" },
  { href: "/academy#curriculum", label: "תכנית לימודים" },
  { href: "/disclaimer", label: "הצהרה משפטית" },
] as const;

export function AcademyHeader() {
  return (
    <header className="academy-header">
      <div className="academy-header__inner">
        <Link href="/academy" className="academy-brand">
          <span className="academy-brand__name">{academyTokens.brand}</span>
          <span className="academy-brand__product">{academyTokens.productHe}</span>
        </Link>
        <nav aria-label="ניווט האקדמיה" className="academy-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="academy-nav__link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
