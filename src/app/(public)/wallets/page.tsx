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
          <p className="mt-1 text-muted-foreground">
            חיפוש כתובת או צפייה בלוח מובילים ציבורי.
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
            <p className="mt-3 text-xs text-muted-foreground">
              או עברו ישירות לכתובת:{" "}
              <span className="ltr-isolate">/wallets/0x…</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">ארנקים מובילים</p>
              <p className="text-sm text-muted-foreground">
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
