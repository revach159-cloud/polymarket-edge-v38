import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database/types";
import { getEnv } from "@/lib/env";

/**
 * Service-role client — server-only. Bypasses RLS.
 * Never import this into client components.
 */
export function createAdminClient() {
  const env = getEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function tryCreateAdminClient() {
  try {
    const env = getEnv();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return null;
    }
    return createAdminClient();
  } catch {
    return null;
  }
}
