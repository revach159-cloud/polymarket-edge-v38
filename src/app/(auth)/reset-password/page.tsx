"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Container } from "@/components/layout/container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");

    if (!isSupabaseConfigured()) {
      setError("אימות אינו מוגדר.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("אין חיבור.");
      return;
    }

    startTransition(async () => {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <main id="main-content" className="pb-10">
      <Container className="flex justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>איפוס סיסמה</CardTitle>
            <CardDescription>בחרו סיסמה חדשה לחשבון</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה חדשה</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="ltr-isolate"
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "מעדכנים…" : "עדכון סיסמה"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
