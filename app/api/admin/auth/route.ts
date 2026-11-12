import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createServerSupabaseClient,
  isAuthorizedAdminEmail,
} from "@/lib/supabase/server";

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
  const rate = checkRateLimit(request, {
    namespace: "admin-login",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return rate.response;
  }

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

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        {
          error: "Email atau kata sandi admin tidak valid.",
        },
        { status: 401 }
      );
    }

    if (!isAuthorizedAdminEmail(data.user.email)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: "Akun ini tidak memiliki hak akses administrator.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login admin berhasil.",
    });
  } catch (error) {
    console.error("POST /api/admin/auth error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat proses autentikasi admin.",
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

    return NextResponse.json({
      success: true,
      message: "Logout berhasil.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/auth error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat proses logout.",
      },
      { status: 500 }
    );
  }
}
