import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  createClient as createSupabaseJsClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAuthorizedAdminEmail } from "./auth-helpers";
import { isSupabaseConfigured } from "./client";

export { isAuthorizedAdminEmail };

/**
 * Creates a server-side Supabase client bound to Next.js App Router cookies
 * using the ANON key so Row Level Security (RLS) policies are enforced.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where setting cookies is not permitted.
        }
      },
    },
  });
}

/**
 * Creates a server-only Supabase Service Role client for privileged operations
 * (such as server-side guest lookup or admin actions after auth verification).
 */
export function createServiceRoleSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey || !isSupabaseConfigured()) {
    return null;
  }

  return createSupabaseJsClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Verifies that the incoming request has an authenticated, authorized admin session.
 */
export async function requireAdminAuth(): Promise<
  | { authorized: true; user: User }
  | { authorized: false; response: NextResponse }
> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Layanan autentikasi belum dikonfigurasi." },
        { status: 503 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isAuthorizedAdminEmail(user.email)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Akses ditolak. Sesi admin tidak valid atau telah berakhir." },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, user };
}

export { createServerSupabaseClient as createClient };
