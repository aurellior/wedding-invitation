"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { WEDDING_CONFIG } from "@/lib/config/wedding-config";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          result.error ||
            result.message ||
            "Kredensial tidak valid. Silakan periksa kembali email dan kata sandi Anda."
        );
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Terjadi gangguan jaringan. Silakan coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAF7F2] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to Invitation Link */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#4A6358] transition-colors hover:text-[#1C2B24]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Undangan</span>
          </Link>
        </div>

        {/* Main Stationery Login Card */}
        <div className="rounded-sm border border-[#C5A059]/45 bg-white p-7 sm:p-9">
          {/* Header */}
          <div className="mb-7 border-b border-[#C5A059]/25 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6825]">
              Akses Panitia &amp; Mempelai
            </p>
            <h1 className="mt-1.5 font-serif-luxury text-3xl font-semibold text-[#1C2B24] sm:text-4xl">
              {WEDDING_CONFIG.couple.groom.nickname} &amp;{" "}
              {WEDDING_CONFIG.couple.bride.nickname}
            </h1>
            <p className="mt-1 text-xs text-[#4A6358]">
              Portal Manajemen Tamu, RSVP &amp; Pengiriman Undangan WhatsApp
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-sm border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]"
              >
                Email Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A6358]" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email admin..."
                  required
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] py-2.5 pl-10 pr-4 text-sm text-[#222624] placeholder:text-[#4A6358]/60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A6358]" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  required
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] py-2.5 pl-10 pr-12 text-sm text-[#222624] placeholder:text-[#4A6358]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sm text-[#4A6358] hover:text-[#1C2B24]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#243830] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24] disabled:opacity-60"
            >
              <span>
                {loading ? "Memverifikasi Akses..." : "Masuk ke Back-Office"}
              </span>
              <ArrowRight className="h-4 w-4 text-[#E5D1A7]" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] text-sm text-[#4A6358]">
          Memuat halaman autentikasi...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
