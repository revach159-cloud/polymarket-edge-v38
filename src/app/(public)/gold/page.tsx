import Link from "next/link";
import { GoldAtmosphere, GoldHero } from "@/components/gold/gold-atmosphere";
import { GoldWordmark } from "@/components/gold/fire-icon";
import { MarketCard } from "@/components/markets/market-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SubscriptionRequired } from "@/components/shared/subscription-required";
import { StaleBanner } from "@/components/shared/stale-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GOLD_EMPTY_MESSAGE } from "@/lib/predictions/gold";
import { canAccessGoldPicks } from "@/lib/permissions";
import { getCurrentProfile } from "@/services/auth";
import { getGoldMarkets } from "@/services/markets";

export const metadata = {
  title: "Gold",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function GoldPage() {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "free";
  const plan = profile?.plan ?? "free";

  if (!canAccessGoldPicks(role, plan)) {
    return (
      <GoldAtmosphere compact className="space-y-4">
        <GoldHero>
          <h1 className="font-display text-3xl font-bold text-gold">
            <GoldWordmark size="lg" className="gold-title-mark" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            בחירות פרימיום שעברו סינון איכות מחמיר.
          </p>
        </GoldHero>
        <SubscriptionRequired
          tier="Gold"
          description="בחירות Gold זמינות למשתמשי Gold ומנהלים בלבד. בדף המנויים ניתן להצטרף לרשימת המתנה עד ש־Stripe יופעל."
        />
      </GoldAtmosphere>
    );
  }

  const result = await getGoldMarkets();

  return (
    <GoldAtmosphere className="space-y-6">
      <GoldHero>
        <Badge variant="gold" className="badge-gold-lux">
          סינון איכות
        </Badge>
        <h1 className="font-display text-3xl font-bold text-gold md:text-4xl">
          <GoldWordmark size="lg" className="gold-title-mark" />
        </h1>
        <p className="text-sm text-muted-foreground md:text-[0.95rem]">
          מוצגות רק בחירות שעברו את רף האיכות — ללא מילוי כפוי של הרשימה.
        </p>
      </GoldHero>

      {result.stale || result.error ? (
        <StaleBanner message={result.error} />
      ) : null}

      {result.data.length === 0 ? (
        <EmptyState
          title={GOLD_EMPTY_MESSAGE}
          action={
            <Button asChild variant="outline">
              <Link href="/markets">לשווקים הפתוחים</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {result.data.map((m) => (
            <MarketCard key={m.id} market={m} variant="gold" />
          ))}
        </div>
      )}
    </GoldAtmosphere>
  );
}
