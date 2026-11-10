import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "wedding_admin_session";

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email admin wajib diisi." })
    .trim()
    .email("Format email admin tidak valid."),
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

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Layanan autentikasi Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi).",
        },
        { status: 500 }
      );
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error: "Gagal menghubungkan ke layanan autentikasi Supabase.",
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
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
