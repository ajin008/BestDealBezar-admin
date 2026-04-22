import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Module-level singleton — survives React re-renders and page navigation
// but resets on full page refresh (which is correct behavior)
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Store session in localStorage for persistence across refreshes
        persistSession: true,
        // Auto refresh token before it expires
        autoRefreshToken: true,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Use localStorage as storage
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
      },
    }
  );

  return browserClient;
}

export function resetClient() {
  browserClient = undefined;
}
