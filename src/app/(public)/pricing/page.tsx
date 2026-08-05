import { Check } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isStripeConfigured } from "@/lib/env";

export const metadata = {
  title: "תמחור",
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₪0",
    description: "גישה לשווקים ציבוריים ומעקב בסיסי",
    features: ["שווקים חיים", "סטטיסטיקה בסיסית", "חיפוש ארנקים"],
    cta: "התחילו בחינם",
    href: "/signup",
    highlight: false,
  },
  {
    id: "core",
    name: "Core",
    price: "בקרוב",
    description: "התראות, מועדפים מתקדמים וסינון Edge",
    features: ["הכל ב־Free", "מועדפים מסונכרנים", "התראות שוק"],
    cta: "בקרוב",
    href: "#waitlist",
    highlight: false,
  },
  {
    id: "gold",
    name: "Gold",
    price: "בקרוב",
    description: "בחירות איכות מנופות וגישה מוקדמת",
    features: ["הכל ב־Core", "Gold Picks", "עדיפות בתמיכה"],
    cta: "בקרוב",
    href: "#waitlist",
    highlight: true,
  },
];

export default function PricingPage() {
  const stripeOn = isStripeConfigured();

  return (
    <main id="main-content" className="pb-10">
      <Container className="space-y-8 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            תמחור שקוף
          </h1>
          <p className="mt-3 text-muted-foreground">
            התחילו בחינם. מנויי Core ו־Gold יופעלו כש־Stripe יחובר.
          </p>
        </div>

        {!stripeOn ? (
          <Alert variant="info" id="waitlist">
            <AlertTitle>תשלומים — בקרוב</AlertTitle>
            <AlertDescription>
              Stripe עדיין כבוי בסביבה זו. השאירו אימייל לרשימת המתנה ונעדכן
              כשהמנויים ייפתחו.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.highlight
                  ? "border-gold/50 bg-gold/5"
                  : undefined
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle
                    className={plan.highlight ? "text-gold" : undefined}
                  >
                    {plan.name}
                  </CardTitle>
                  {plan.highlight ? <Badge variant="gold">מומלץ</Badge> : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-2 font-display text-3xl font-bold">
                  {stripeOn && plan.id !== "free" ? "—" : plan.price}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.id === "free" ? (
                  <Button asChild className="w-full">
                    <a href={plan.href}>{plan.cta}</a>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "gold" : "secondary"}
                    disabled={!stripeOn}
                  >
                    {stripeOn ? "הצטרפות" : "בקרוב"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {!stripeOn ? (
          <Card>
            <CardHeader>
              <CardTitle>רשימת המתנה</CardTitle>
              <CardDescription>
                נעדכן כשמנויים ישולמו דרך Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-3 sm:flex-row"
                action="mailto:hello@edgedlab.local"
                method="get"
              >
                <Input
                  type="email"
                  name="body"
                  required
                  placeholder="you@example.com"
                  className="ltr-isolate"
                  dir="ltr"
                />
                <Button type="submit" variant="outline">
                  שליחה
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </Container>
    </main>
  );
}
