import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "ארנקים",
};

export default function WalletsPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="space-y-8 py-8">
        <div>
          <h1 className="font-display text-3xl font-bold">ארנקים</h1>
          <p className="text-muted-foreground mt-1">
            חיפוש כתובת, ארנקי מפלצות עם כמעט בלי הפסדים, או לוח מובילים ציבורי.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>חיפוש כתובת</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/wallets/lookup" className="flex flex-col gap-3 sm:flex-row">
              <Input
                name="address"
                placeholder="0x…"
                required
                className="ltr-isolate font-mono"
                dir="ltr"
                pattern="0x[a-fA-F0-9]{40}"
                title="כתובת Ethereum תקינה"
              />
              <Button type="submit">חיפוש</Button>
            </form>
            <p className="text-muted-foreground mt-3 text-xs">
              או עברו ישירות לכתובת: <span className="ltr-isolate">/wallets/0x…</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-gold/35 bg-[linear-gradient(135deg,rgba(255,225,115,0.12),transparent)]">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-gold font-semibold">רווחים משוגעים · כמעט בלי הפסדים</p>
              <p className="text-muted-foreground text-sm">
                ארנקים עם PnL גבוה, שיעור ניצחון גבוה, וגורם רווח גבוה — בלי הפסדים פתוחים שמסתירים
                את התמונה.
              </p>
            </div>
            <Button asChild variant="gold">
              <Link href="/wallets/elite">למפלצות</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">ארנקים מובילים</p>
              <p className="text-muted-foreground text-sm">
                דירוג ציבורי לפי נתוני Polymarket Data API
              </p>
            </div>
            <Button asChild>
              <Link href="/wallets/top">ללוח המובילים</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
