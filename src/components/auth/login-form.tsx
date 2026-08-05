"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/redirect";
import { isSupabaseConfigured } from "@/lib/env";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = getSafeRedirectPath(searchParams.get("next"));
  const reason = searchParams.get("reason");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    if (!isSupabaseConfigured()) {
      setError("שירות ההתחברות אינו מוגדר כרגע. הגדירו את משתני Supabase.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("לא ניתן להתחבר לשרת האימות.");
      return;
    }

    startTransition(async () => {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {reason === "auth-unavailable" ? (
        <Alert variant="warning">
          <AlertDescription>
            אימות אינו זמין עד להגדרת Supabase. ניתן לגלוש בשווקים הציבוריים.
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="ltr-isolate"
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">סיסמה</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            שכחתי סיסמה
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="ltr-isolate"
          dir="ltr"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "מתחברים…" : "התחברות"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        אין חשבון?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          הרשמה
        </Link>
      </p>
    </form>
  );
}
