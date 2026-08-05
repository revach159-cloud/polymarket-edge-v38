import Link from "next/link";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="mt-auto hidden border-t border-border py-8 md:block">
      <Container className="flex flex-col gap-4 text-sm text-foreground-muted md:flex-row md:items-center md:justify-between">
        <p>Polymarket Edge Lab — מידע וניתוח בלבד. אינו ייעוץ פיננסי ואינו מבצע עסקאות.</p>
        <nav aria-label="קישורים משפטיים" className="flex flex-wrap gap-4">
          <Link href="/disclaimer" className="hover:text-foreground">
            כתב ויתור
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            תנאים
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            פרטיות
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            יצירת קשר
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
