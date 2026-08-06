"use client";

import Link from "next/link";
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
import { cn } from "@/lib/utils";

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
  { value: "5h", label: "עד 5ש" },
  { value: "24h", label: "עד 24ש" },
  { value: "3d", label: "עד 3י" },
  { value: "7d", label: "עד 7י" },
  { value: "30d", label: "עד 30י" },
];

export function MarketFilters({ resultCount }: { resultCount?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const sort = searchParams.get("sort") ?? "smart";
  const status = searchParams.get("status") ?? "active";
  const category = searchParams.get("category") ?? "all";
  const horizon = searchParams.get("horizon") ?? "all";

  const hasActiveFilters = Boolean(
    searchParams.get("q") ||
      searchParams.get("category") ||
      searchParams.get("horizon") ||
      (searchParams.get("sort") && searchParams.get("sort") !== "smart") ||
      (searchParams.get("status") && searchParams.get("status") !== "active"),
  );

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
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resultCount == null
            ? "סינון שווקים"
            : pending
              ? "מעדכן תוצאות…"
              : `${resultCount} פרדיקשנים איכותיים`}
        </p>
        {hasActiveFilters ? (
          <Link
            href="/markets"
            className="text-sm font-semibold text-primary hover:underline"
          >
            איפוס מסננים
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="q">חיפוש</Label>
          <Input
            id="q"
            name="q"
            value={q}
            placeholder="חיפוש חכם: קבוצה, קריפטו, בחירות…"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="w-36 space-y-1.5">
          <Label>מיון</Label>
          <Select value={sort} onValueChange={(v) => update("sort", v)}>
            <SelectTrigger aria-label="מיון">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smart">חכם (קרוב+סבירות)</SelectItem>
              <SelectItem value="endDate">קרוב לסגירה</SelectItem>
              <SelectItem value="relevance">רלוונטיות לחיפוש</SelectItem>
              <SelectItem value="quality">ציון איכות</SelectItem>
              <SelectItem value="edge">ציון Edge</SelectItem>
              <SelectItem value="volume">נפח</SelectItem>
              <SelectItem value="liquidity">נזילות</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-36 space-y-1.5">
          <Label>סטטוס</Label>
          <Select value={status} onValueChange={(v) => update("status", v)}>
            <SelectTrigger aria-label="סטטוס">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">פעילים</SelectItem>
              <SelectItem value="closed">סגורים (טבלה למטה)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label id="category-label">קטגוריה</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="category-label">
          {categories.map((item) => {
            const active = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => update("category", item.value)}
                className={cn("nav-pill", active && "nav-pill-active")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label id="horizon-label">אופק סגירה · עדיפות לקרובים</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="horizon-label">
          {horizons.map((item) => {
            const active = horizon === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => update("horizon", item.value)}
                className={cn("nav-pill", active && "nav-pill-active")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
