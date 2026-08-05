"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MarketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
      startTransition(() => {
        router.push(`/markets?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (q !== current) update("q", q);
    }, 400);
    return () => clearTimeout(handle);
  }, [q, searchParams, update]);

  return (
    <div
      className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy={pending}
    >
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="q">חיפוש</Label>
        <Input
          id="q"
          name="q"
          value={q}
          placeholder="שאלה, קטגוריה…"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>מיון</Label>
        <Select
          defaultValue={searchParams.get("sort") ?? "volume"}
          onValueChange={(v) => update("sort", v)}
        >
          <SelectTrigger aria-label="מיון">
            <SelectValue placeholder="מיון" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">נפח</SelectItem>
            <SelectItem value="liquidity">נזילות</SelectItem>
            <SelectItem value="endDate">תאריך סיום</SelectItem>
            <SelectItem value="edge">ציון Edge</SelectItem>
            <SelectItem value="quality">ציון איכות</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>סטטוס</Label>
        <Select
          defaultValue={searchParams.get("status") ?? "active"}
          onValueChange={(v) => update("status", v)}
        >
          <SelectTrigger aria-label="סטטוס">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">פעילים</SelectItem>
            <SelectItem value="closed">סגורים</SelectItem>
            <SelectItem value="all">הכל</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>קטגוריה</Label>
        <Select
          defaultValue={searchParams.get("category") ?? "all"}
          onValueChange={(v) => update("category", v)}
        >
          <SelectTrigger aria-label="קטגוריה">
            <SelectValue placeholder="קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="Politics">Politics</SelectItem>
            <SelectItem value="Sports">Sports</SelectItem>
            <SelectItem value="Crypto">Crypto</SelectItem>
            <SelectItem value="Pop Culture">Pop Culture</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
