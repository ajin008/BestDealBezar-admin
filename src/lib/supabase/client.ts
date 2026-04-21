import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase browser client.
 * @supabase/ssr's createBrowserClient already handles singleton pattern
 * internally and persists session in cookies automatically.
 * Do NOT wrap this in useMemo or module-level singleton —
 * let the library manage its own instance.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function resetClient() {
  // No-op — createBrowserClient handles cleanup internally
}
