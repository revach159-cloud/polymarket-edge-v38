import { Check } from "lucide-react";
import { FireIcon } from "@/components/gold/fire-icon";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    period: "לתמיד",
    description: "נקודת כניסה חינמית למחקר שווקי חיזוי.",
    features: ["מודל השווקים", "סטטיסטיקת פעילות", "חיפוש ארנקים בסיסי"],
    cta: "התחילו בחינם",
    href: "/signup",
  },
  {
    id: "core",
    name: "Core",
    price: "יוכרז בהשקה",
    period: "ללא חיוב כרגע",
    description: "כלי מעקב וסינון מתקדמים למחקר מסודר.",
    features: ["הכל ב־Free", "מועדפים מסונכרנים", "התראות שוק כשיהיו זמינות"],
    cta: "לרשימת ההמתנה",
    href: "#waitlist",
  },
  {
    id: "gold",
    name: "Gold",
    price: "יוכרז בהשקה",
    period: "ללא חיוב כרגע",
    description: "גישה לבחירות איכות שעברו סינון, בכפוף לזמינות.",
    features: ["הכל ב־Core", "Gold Picks מסוננים", "עדיפות בתמיכה"],
    cta: "להצטרפות לרשימת ההמתנה",
    href: "#waitlist",
  },
];

export default function PricingPage() {
  const stripeOn = isStripeConfigured();

  return (
    <Container className="space-y-8 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-10 text-center sm:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(125,255,106,0.14),transparent_70%)]" />
        <div className="relative mx-auto max-w-2xl">
          <Badge className="mb-4" variant="outline">מנויים</Badge>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">תמחור ברור. מחקר אחראי.</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            בחרו את עומק הכלים שמתאים לכם. אין הבטחות לתשואה, ואין חיוב עד שחיבור התשלומים יהיה פעיל.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const gold = plan.id === "gold";
          return (
            <article
              key={plan.id}
              className={`relative flex min-h-[30rem] flex-col overflow-hidden rounded-2xl border p-6 ${
                gold
                  ? "border-gold/55 bg-[radial-gradient(ellipse_at_top,rgba(255,225,115,0.18),transparent_55%)] shadow-[0_0_40px_rgba(255,225,115,0.08)]"
                  : "border-border bg-card"
              }`}
            >
              {gold ? (
                <div className="mb-6 flex items-center justify-between">
                  <Badge variant="gold">המסלול הבכיר</Badge>
                  <FireIcon size="md" />
                </div>
              ) : <div className="mb-6 h-7" />}
              <h2 className={`font-display text-3xl font-bold ${gold ? "text-gold" : ""}`}>{plan.name}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <div className="my-7 border-y border-border/80 py-5">
                <p className={`font-display text-3xl font-bold ${gold ? "text-gold" : ""}`}>{plan.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">{plan.period}</p>
              </div>
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className={gold ? "mt-0.5 h-4 w-4 shrink-0 text-gold" : "mt-0.5 h-4 w-4 shrink-0 text-primary"} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-auto w-full" variant={gold ? "gold" : plan.id === "free" ? "default" : "secondary"}>
                <a href={plan.href}>{plan.cta}</a>
              </Button>
            </article>
          );
        })}
      </div>

      <section id="waitlist" className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">רשימת המתנה</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stripeOn
                ? "הצטרפות בתשלום עדיין אינה זמינה בדף זה; נעדכן כשהמסלול ייפתח."
                : "Stripe עדיין אינו מחובר בסביבה זו. השאירו אימייל לעדכון ההשקה."}
            </p>
          </div>
          <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" action="mailto:hello@edgedlab.local" method="get">
            <Input type="email" name="body" required placeholder="you@example.com" className="ltr-isolate sm:w-64" dir="ltr" />
            <Button type="submit" variant="outline">עדכנו אותי</Button>
          </form>
        </div>
      </section>
    </Container>
  );
}
