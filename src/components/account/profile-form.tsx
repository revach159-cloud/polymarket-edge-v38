"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/actions/favorites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfile(fd);
      if (!res.ok) {
        setError(res.error ?? "שגיאה");
        return;
      }
      setMsg("הפרופיל עודכן");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {msg ? (
        <Alert variant="success">
          <AlertDescription>{msg}</AlertDescription>
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
          value={profile.email}
          disabled
          className="ltr-isolate"
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">שם תצוגה</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.displayName ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label>מנוי</Label>
        <Input value={profile.tier} disabled />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "שומרים…" : "שמירת שינויים"}
      </Button>
    </form>
  );
}
