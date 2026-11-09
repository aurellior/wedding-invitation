"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  KeyRound,
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

  const [email, setEmail] = useState("admin@wedding.id");
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
          email: email.trim() || "admin@wedding.id",
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          result.error ||
            result.message ||
            "Kredensial tidak valid. Silakan periksa kembali password admin Anda."
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

  const handleQuickFillDemo = () => {
    setEmail("admin@wedding.id");
    setPassword("wedding2026");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle botanical luxury background accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#243830]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Back to Invitation Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#4A6358] hover:text-[#243830] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Halaman Undangan
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#E5D1A7]/60 shadow-xl p-7 sm:p-9">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#243830]/8 border border-[#243830]/15 text-[#243830] text-[11px] font-semibold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Wedding Back-Office
            </div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-semibold text-[#243830]">
              {WEDDING_CONFIG.couple.groom.nickname} &amp;{" "}
              {WEDDING_CONFIG.couple.bride.nickname}
            </h1>
            <p className="text-xs text-[#4A6358] mt-1.5">
              Portal Manajemen Tamu, RSVP &amp; Pengiriman Undangan WhatsApp
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#243830] uppercase tracking-wider mb-1.5"
              >
                Email Admin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#4A6358] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wedding.id"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5D1A7] bg-[#FAF7F2]/60 text-sm text-[#222624] placeholder:text-[#222624]/40 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#243830] uppercase tracking-wider mb-1.5"
              >
                Password / Kunci Akses
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#4A6358] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin..."
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#E5D1A7] bg-[#FAF7F2]/60 text-sm text-[#222624] placeholder:text-[#222624]/40 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan Password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#4A6358] hover:text-[#243830] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-[#243830] hover:bg-[#1b2b24] text-[#FAF7F2] text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? "Memverifikasi Akses..." : "Masuk ke Dashboard"}</span>
              <ArrowRight className="w-4 h-4 text-[#E5D1A7]" />
            </button>
          </form>

          {/* Demo / Environment Hint Box */}
          <div className="mt-6 pt-5 border-t border-[#E5D1A7]/40">
            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E5D1A7]/70 p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#243830]">
                  <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Akses Demo &amp; Supabase Auth</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  className="text-[11px] font-semibold text-[#C5A059] hover:text-[#243830] underline underline-offset-2 cursor-pointer"
                >
                  Isi Otomatis
                </button>
              </div>
              <p className="text-[11px] text-[#4A6358] leading-relaxed">
                Untuk pengujian lokal/demo, gunakan password default{" "}
                <code className="px-1.5 py-0.5 rounded bg-[#243830]/10 text-[#243830] font-mono font-semibold">
                  wedding2026
                </code>{" "}
                (atau sesuai variabel{" "}
                <code className="font-mono text-[#243830]">ADMIN_PASSWORD</code>{" "}
                pada <code className="font-mono text-[#243830]">.env</code>).
                Akun Supabase Auth juga terhubung otomatis bila telah dikonfigurasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-sm text-[#4A6358]">
          Memuat halaman autentikasi...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
