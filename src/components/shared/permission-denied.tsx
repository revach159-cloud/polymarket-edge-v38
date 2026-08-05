import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PermissionDenied({
  title = "אין הרשאה",
  description = "אין לכם הרשאה לצפות בתוכן זה.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-14 text-center">
      <ShieldOff className="mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-5" variant="outline">
        <Link href="/">חזרה לדף הבית</Link>
      </Button>
    </div>
  );
}
