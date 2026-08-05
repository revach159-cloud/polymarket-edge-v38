import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata = { title: "צור קשר" };

export default function ContactPage() {
  return (
    <main id="main-content" className="pb-10">
      <Container className="max-w-xl space-y-6 py-10">
        <div>
          <h1 className="font-display text-3xl font-bold">צור קשר</h1>
          <p className="mt-2 text-muted-foreground">
            שאלות על המוצר, פרטיות או שותפויות.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>הודעה</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action="mailto:hello@edgedlab.local"
              method="get"
              encType="text/plain"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="ltr-isolate"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="body">הודעה</Label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={5}
                  className="flex w-full rounded-lg border border-input bg-background-muted px-3 py-2 text-sm"
                />
              </div>
              <Button type="submit">פתיחת אימייל</Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
