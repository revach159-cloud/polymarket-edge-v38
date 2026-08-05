"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(marketId: string) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase לא מוגדר" };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "אין חיבור" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "נדרשת התחברות" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("market_id", marketId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    revalidatePath("/account");
    revalidatePath("/markets");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    market_id: marketId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/account");
  revalidatePath("/markets");
  return { ok: true, favorited: true };
}

export async function updateProfile(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase לא מוגדר" };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "אין חיבור" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "נדרשת התחברות" };

  const displayName = String(formData.get("displayName") ?? "").trim();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName || null,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/account");
  return { ok: true };
}
