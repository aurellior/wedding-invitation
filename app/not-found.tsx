import React from "react";
import { Lock, MessageCircle, Sparkles } from "lucide-react";
import { getWeddingConfig } from "@/lib/supabase/repository";

export default async function NotFound() {
  const config = await getWeddingConfig();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#1C2B24] px-5 py-8 text-[#FAF7F2] sm:px-8 sm:py-12">
      {/* Ambient radial gold & sage glow + Botanical SVG pattern (matching CoverOverlay) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#C5A059]/15 blur-[110px]" />
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[480px] -translate-x-1/2 rounded-full bg-[#4A6358]/20 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="not-found-botanical-grid"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M32 0 C38 18 46 26 64 32 C46 38 38 46 32 64 C26 46 18 38 0 32 C18 26 26 18 32 0 Z"
                fill="none"
                stroke="#C5A059"
                strokeWidth="0.75"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#not-found-botanical-grid)"
          />
        </svg>
      </div>

      {/* Outer Double Ornamental Frame */}
      <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C5A059]/30 sm:inset-6 sm:rounded-3xl" />
      <div className="pointer-events-none absolute inset-4 rounded-xl border border-[#C5A059]/15 sm:inset-8 sm:rounded-2xl" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/35 bg-[#243830]/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[#E5D1A7] backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
          <span>Private Wedding Invitation</span>
        </div>
      </div>

      {/* Center Content & Editorial Card */}
      <div className="relative z-10 my-auto flex w-full max-w-lg flex-col items-center py-6 text-center">
        {/* Botanical Monogram Crest */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#C5A059]/40 bg-[#243830]/80 shadow-[0_0_30px_rgba(197,160,89,0.18)]">
          <span className="font-serif-luxury text-2xl font-semibold tracking-widest text-[#E5D1A7]">
            {config.couple.groom.nickname[0]}
            <span className="mx-0.5 text-sm text-[#C5A059]">&amp;</span>
            {config.couple.bride.nickname[0]}
          </span>
        </div>

        <p className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-[#E5D1A7]/80">
          The Wedding Of
        </p>

        <h1 className="font-serif-luxury text-4xl font-normal tracking-wide text-[#FAF7F2] sm:text-5xl">
          {config.couple.groom.nickname}{" "}
          <span className="font-serif-luxury italic text-[#C5A059]">&amp;</span>{" "}
          {config.couple.bride.nickname}
        </h1>

        <div className="mt-3 flex items-center gap-3 text-xs tracking-[0.22em] text-[#E5D1A7]/85">
          <span className="h-[1px] w-8 bg-[#C5A059]/50" />
          <span>{config.couple.weddingDateDisplay}</span>
          <span className="h-[1px] w-8 bg-[#C5A059]/50" />
        </div>

        {/* Letterpress Warm Ivory Notice Card */}
        <div className="mt-7 w-full rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2]/95 px-6 py-7 text-[#222624] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-9 sm:py-8">
          <div className="mx-auto mb-3.5 inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#243830]">
            <Lock className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>404 • Undangan Tidak Ditemukan</span>
          </div>

          <h2 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24] sm:text-3xl">
            Khusus Tamu Terdaftar
          </h2>

          <div className="my-4 border-y border-[#C5A059]/25 py-4">
            <p className="text-xs leading-relaxed text-[#4A6358] sm:text-sm">
              Mohon maaf, tautan undangan yang Anda buka tidak lengkap atau nama
              tamu tidak terdaftar pada daftar undangan resmi kami.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-[#C5A059]/30 bg-[#F2ECE1]/70 p-4 text-left text-xs leading-relaxed text-[#243830]">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A059]" />
            <p>
              Silakan buka kembali{" "}
              <strong className="font-semibold text-[#1C2B24]">
                tautan undangan personal
              </strong>{" "}
              yang telah dikirimkan secara khusus melalui pesan WhatsApp kepada
              Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Hashtag */}
      <div className="relative z-10 text-center text-[11px] tracking-[0.25em] text-[#E5D1A7]/60">
        {config.couple.hashtag}
      </div>
    </main>
  );
}

