import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Market, Profile, SubscriptionTier, UserRole } from "@/types";

function asRole(value: unknown): UserRole {
  if (value === "admin" || value === "gold" || value === "core" || value === "free") {
    return value;
  }
  return "free";
}

function asPlan(value: unknown): SubscriptionTier {
  if (value === "gold" || value === "core" || value === "free") return value;
  return "free";
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const role = asRole(profile?.role);
  const plan = asPlan(profile?.plan ?? profile?.tier);

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "",
    displayName: profile?.display_name ?? user.user_metadata?.full_name ?? null,
    tier: plan,
    plan,
    role,
    createdAt: profile?.created_at ?? user.created_at,
    onboardingCompleted: Boolean(profile?.onboarding_completed),
  };
}

export async function requireUser() {
  return getCurrentProfile();
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

export async function getFavoriteMarkets(userId: string): Promise<Market[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("favorites")
    .select("market_id, markets(*)")
    .eq("user_id", userId);

  if (!data) return [];

  return data
    .map((row) => {
      const m = row.markets as unknown as Record<string, unknown> | null;
      if (!m || typeof m !== "object") return null;
      return {
        id: String(m.id),
        slug: String(m.slug ?? ""),
        question: String(m.question ?? ""),
        volume: Number(m.volume ?? 0),
        liquidity: Number(m.liquidity ?? 0),
        outcomes: Array.isArray(m.outcomes) ? m.outcomes : [],
        active: Boolean(m.active),
        closed: Boolean(m.closed),
        goldPick: Boolean(m.gold_pick),
        endDate: (m.end_date as string) ?? null,
        category: (m.category as string) ?? undefined,
      } as Market;
    })
    .filter(Boolean) as Market[];
}
