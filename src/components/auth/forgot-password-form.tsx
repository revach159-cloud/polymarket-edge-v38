"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl, isSupabaseConfigured } from "@/lib/env";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "");

    if (!isSupabaseConfigured()) {
      setError("שירות האימות אינו מוגדר כרגע.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("לא ניתן להתחבר לשרת האימות.");
      return;
    }

    startTransition(async () => {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password` },
      );
      if (authError) {
        setError(authError.message);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <Alert variant="success">
        <AlertDescription>
          אם קיים חשבון עם האימייל הזה, נשלח קישור לאיפוס סיסמה.{" "}
          <Link href="/login" className="underline">
            חזרה להתחברות
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          className="ltr-isolate"
          dir="ltr"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "שולחים…" : "שליחת קישור איפוס"}
      </Button>
    </form>
  );
}
