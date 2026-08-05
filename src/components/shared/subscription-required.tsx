import Link from "next/link";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscriptionRequired({
  tier = "Gold",
  description = "תוכן זה זמין למנויי Gold בלבד.",
}: {
  tier?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gold/30 bg-gold/5 px-6 py-14 text-center">
      <Crown className="mb-3 h-8 w-8 text-gold" aria-hidden />
      <h2 className="font-display text-xl font-semibold text-gold">
        נדרש מנוי {tier}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 flex gap-2">
        <Button asChild variant="gold">
          <Link href="/pricing">לצפייה בתמחור</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/markets">שווקים פתוחים</Link>
        </Button>
      </div>
    </div>
  );
}
