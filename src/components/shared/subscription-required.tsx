import Link from "next/link";
import { FireIcon } from "@/components/gold/fire-icon";
import { Button } from "@/components/ui/button";

export function SubscriptionRequired({
  tier = "Gold",
  description = "תוכן זה זמין למנויי Gold בלבד.",
}: {
  tier?: string;
  description?: string;
}) {
  return (
    <div className="gold-gate flex flex-col items-center justify-center px-6 py-14 text-center">
      <FireIcon size="lg" className="mb-3" />
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
