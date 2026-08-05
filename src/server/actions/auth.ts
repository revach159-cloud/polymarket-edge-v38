"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const GENERIC_AUTH_ERROR = "לא ניתן להשלים את הפעולה. בדקו את הפרטים ונסו שוב.";

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=config");
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=config");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=auth`);
  redirect("/");
}

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/signup?error=config");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const display_name = String(formData.get("display_name") ?? "");
  const supabase = await createClient();
  if (!supabase) redirect("/signup?error=config");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name } },
  });
  if (error) redirect("/signup?error=auth");
  redirect("/verify-email");
}

export async function forgotPassword(formData: FormData) {
  void formData;
  // Always redirect the same way to avoid user enumeration.
  if (!isSupabaseConfigured()) redirect("/forgot-password?sent=1");
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  if (supabase && email) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
  }
  redirect("/forgot-password?sent=1");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

export function authErrorMessage(): string {
  return GENERIC_AUTH_ERROR;
}
