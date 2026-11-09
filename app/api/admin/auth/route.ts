import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "wedding_admin_session";

const loginSchema = z.object({
  email: z.string().trim().optional(),
  password: z
    .string({ required_error: "Kata sandi admin wajib diisi." })
    .min(1, "Kata sandi admin tidak boleh kosong."),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = loginSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Kredensial login tidak valid.",
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    let isAuthenticated = false;

    if (isSupabaseConfigured() && email) {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error && data.session) {
          isAuthenticated = true;
        }
      }
    }

    if (!isAuthenticated) {
      const fallbackPassword = process.env.ADMIN_PASSWORD || "wedding2026";
      const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const normalizedEmail = email?.trim().toLowerCase();

      const emailMatches =
        !normalizedEmail ||
        !configuredEmail ||
        normalizedEmail === configuredEmail ||
        normalizedEmail === "admin@wedding.id";

      if (password === fallbackPassword && emailMatches) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: "Email atau kata sandi admin tidak valid.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login admin berhasil.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "authenticated",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat proses autentikasi admin.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat proses logout.",
      },
      { status: 500 }
    );
  }
}
