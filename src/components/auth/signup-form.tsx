"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl, isSupabaseConfigured } from "@/lib/env";

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const displayName = String(fd.get("displayName") ?? "");

    if (!isSupabaseConfigured()) {
      setError("שירות ההרשמה אינו מוגדר כרגע.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("לא ניתן להתחבר לשרת האימות.");
      return;
    }

    startTransition(async () => {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName },
          emailRedirectTo: `${getAppUrl()}/auth/callback?next=/onboarding`,
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setMessage("נשלח מייל אימות (אם נדרש). מעבירים להשלמת פרופיל…");
      router.push("/verify-email");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert variant="success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">שם תצוגה</Label>
        <Input id="displayName" name="displayName" autoComplete="name" />
      </div>
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
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="ltr-isolate"
          dir="ltr"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "נרשמים…" : "יצירת חשבון"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        כבר רשומים?{" "}
        <Link href="/login" className="text-primary hover:underline">
          התחברות
        </Link>
      </p>
    </form>
  );
}
