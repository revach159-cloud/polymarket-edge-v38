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

const categories = [
  { value: "all", label: "הכל" },
  { value: "Politics", label: "פוליטיקה" },
  { value: "Sports", label: "ספורט" },
  { value: "Crypto", label: "קריפטו" },
  { value: "Business", label: "עסקים" },
];

const horizons = [
  { value: "all", label: "הכל" },
  { value: "2h", label: "עד 2ש" },
  { value: "24h", label: "עד 24ש" },
  { value: "7d", label: "עד 7י" },
  { value: "30d", label: "עד 30י" },
];

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
      className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-4"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="q">חיפוש</Label>
          <Input
            id="q"
            name="q"
            value={q}
            placeholder="שאלה, קטגוריה…"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="w-36 space-y-1.5">
          <Label>מיון</Label>
          <Select
            defaultValue={searchParams.get("sort") ?? "endDate"}
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
        <div className="w-32 space-y-1.5">
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
      </div>
      <div className="space-y-2">
        <Label>קטגוריה</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => update("category", category.value)}
              className={`nav-pill ${(
                searchParams.get("category") ?? "all"
              ) === category.value ? "nav-pill-active" : ""}`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>אופק סגירה</Label>
        <div className="flex flex-wrap gap-2">
          {horizons.map((horizon) => (
            <button
              key={horizon.value}
              type="button"
              onClick={() => update("horizon", horizon.value)}
              className={`nav-pill ${(
                searchParams.get("horizon") ?? "all"
              ) === horizon.value ? "nav-pill-active" : ""}`}
            >
              {horizon.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
