import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database/types";
import { getEnv, isSupabaseConfigured } from "@/lib/env";

export function createClient() {
  const env = getEnv();
  if (!isSupabaseConfigured() || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
