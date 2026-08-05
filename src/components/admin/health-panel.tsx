import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HealthPanel({
  health,
  system,
}: {
  health: {
    supabase: boolean;
    cronSecret: boolean;
    stripe: boolean;
    version: string;
  };
  system: {
    gamma: string;
    clob: string;
    supabase: string;
    lastCheckedAt: string;
  };
}) {
  const row = (label: string, ok: boolean | string) => {
    const warn = ok === "degraded" || ok === "missing";
    return (
      <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
        <span className="text-sm">{label}</span>
        <Badge
          variant={
            ok === true || ok === "ok"
              ? "success"
              : warn
                ? "warning"
                : "risk"
          }
        >
          {String(ok)}
        </Badge>
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>בריאות מערכת</CardTitle>
        </CardHeader>
        <CardContent>
          {row("Gamma API", system.gamma)}
          {row("CLOB API", system.clob)}
          {row("Supabase", system.supabase)}
          <p className="mt-3 text-xs text-muted-foreground ltr-isolate">
            נבדק: {system.lastCheckedAt}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>תצורה</CardTitle>
        </CardHeader>
        <CardContent>
          {row("Supabase keys", health.supabase)}
          {row("CRON_SECRET", health.cronSecret)}
          {row("Stripe", health.stripe)}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">גרסה</span>
            <span className="ltr-isolate text-sm text-muted-foreground">
              {health.version}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
