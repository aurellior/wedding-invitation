import React from "react";
import { Lock, Sparkles } from "lucide-react";
import { getWeddingConfig } from "@/lib/supabase/repository";

export default async function NotFound() {
  const config = await getWeddingConfig();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAF7F2] px-4 py-12 text-[#222624] sm:px-6">
      {/* Subtle botanical & gold ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#C5A059]/15 blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[480px] -translate-x-1/2 rounded-full bg-[#243830]/8 blur-[100px]" />
      </div>

      {/* Outer Ornamental Frame */}
      <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C5A059]/35 sm:inset-6 sm:rounded-3xl" />
      <div className="pointer-events-none absolute inset-4 rounded-xl border border-[#C5A059]/15 sm:inset-8 sm:rounded-2xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#243830]">
          <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>404 • Not Found</span>
        </div>

        {/* Main Card */}
        <div className="mt-6 w-full rounded-3xl border border-[#C5A059]/40 bg-white/90 p-8 shadow-[0_20px_60px_rgba(36,56,48,0.08)] backdrop-blur-md sm:p-10">
          {/* Crest / Lock Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#C5A059]/45 bg-[#243830] text-[#E5D1A7] shadow-md">
            <Lock className="h-6 w-6 text-[#C5A059]" />
          </div>

          <p className="font-serif-luxury text-5xl font-semibold tracking-wider text-[#C5A059] sm:text-6xl">
            404
          </p>

          <h1 className="mt-2 font-serif-luxury text-3xl font-semibold text-[#1C2B24] sm:text-4xl">
            Undangan Tidak Ditemukan
          </h1>

          <div className="mx-auto my-5 flex max-w-xs items-center justify-center gap-3">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#C5A059]/50" />
            <span className="font-serif-luxury text-sm italic text-[#243830]">
              {config.couple.groom.nickname} &amp; {config.couple.bride.nickname}
            </span>
            <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#C5A059]/50" />
          </div>

          <p className="text-xs leading-relaxed text-[#4A6358] sm:text-sm">
            Mohon maaf, tautan undangan yang Anda akses tidak valid atau nama
            tamu tidak terdaftar dalam daftar undangan resmi kami.
          </p>

          <div className="mt-6 rounded-2xl border border-[#C5A059]/30 bg-[#FAF7F2] p-4 text-xs leading-relaxed text-[#243830]">
            Silakan buka kembali tautan undangan personal yang telah dikirimkan
            melalui pesan WhatsApp kepada Anda.
          </div>
        </div>

        {/* Footer Hashtag */}
        <p className="mt-6 text-[11px] font-semibold tracking-[0.25em] text-[#4A6358]">
          {config.couple.hashtag}
        </p>
      </div>
    </main>
  );
}

