import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isAuthorizedAdminEmail } from "@/lib/supabase/auth-helpers";

function isProtectedApiRequest(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/guests")) return true;
  if (pathname.startsWith("/api/rsvp") && method === "GET") return true;
  if (pathname.startsWith("/api/settings") && method !== "GET") return true;
  if (pathname.startsWith("/api/audio") && method !== "GET") return true;
  if (pathname.startsWith("/api/wishes") && method === "DELETE") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const needsAdminAuth =
    pathname.startsWith("/admin") || isProtectedApiRequest(pathname, method);

  if (!needsAdminAuth) {
    return response;
  }

  // Verify Supabase Auth session via @supabase/ssr
  let isAuthenticatedAdmin = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http")
  ) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && isAuthorizedAdminEmail(user.email)) {
        isAuthenticatedAdmin = true;
      }
    } catch {
      isAuthenticatedAdmin = false;
    }
  }

  // Protect administrative API routes with 401 JSON
  if (pathname.startsWith("/api/")) {
    if (!isAuthenticatedAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Sesi admin diperlukan." },
        { status: 401 }
      );
    }
    return response;
  }

  // Allow public access to /admin/login, or redirect to /admin if already authenticated
  if (pathname === "/admin/login") {
    if (isAuthenticatedAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return response;
  }

  // Protect all other /admin/* routes
  if (pathname.startsWith("/admin") && !isAuthenticatedAdmin) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
