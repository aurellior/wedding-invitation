import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const PLACEHOLDER_MARKERS = [
  "your-project-ref",
  "your-anon-key",
  "placeholder",
  "example.supabase.co",
];

/**
 * Checks whether valid Supabase environment variables are configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return false;
  }

  const lowerUrl = url.toLowerCase();
  const lowerKey = anonKey.toLowerCase();

  for (const marker of PLACEHOLDER_MARKERS) {
    if (lowerUrl.includes(marker) || lowerKey.includes(marker)) {
      return false;
    }
  }

  return lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://");
}

let browserClientInstance: SupabaseClient | null = null;

/**
 * Creates or returns a singleton Supabase browser client if configured, or `null` when running in fallback mode.
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (browserClientInstance) {
    return browserClientInstance;
  }

  browserClientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClientInstance;
}

/**
 * Returns a typed Supabase browser client, throwing an error if Supabase is not configured.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const client = createClient();
  if (!client) {
    throw new Error(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured."
    );
  }
  return client;
}
