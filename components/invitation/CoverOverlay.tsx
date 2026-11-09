"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MailOpen, Sparkles, ShieldCheck } from "lucide-react";
import { WEDDING_CONFIG } from "@/lib/config/wedding-config";
import type { GuestCategory } from "@/types/wedding";

export interface CoverOverlayProps {
  guestName: string;
  guestCategory?: GuestCategory | null;
  isRegistered?: boolean;
  isOpened: boolean;
  onOpenInvitation: () => void;
}

export default function CoverOverlay({
  guestName,
  guestCategory,
  isRegistered = false,
  isOpened,
  onOpenInvitation,
}: CoverOverlayProps) {
  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpened]);

  const handleOpenClick = () => {
    // Dispatch custom window event so AudioController can unlock & start audio within user gesture
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("wedding:unlock-audio"));
    }
    onOpenInvitation();
  };

  return (
    <AnimatePresence>
      {!isOpened && (
        <motion.div
          key="wedding-cover-overlay"
          initial={{ opacity: 1, y: 0 }}
          exit={{
            y: "-100%",
            opacity: 0,
            transition: {
              duration: 1.05,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-y-auto bg-[#1C2B24] px-5 py-8 text-[#FAF7F2] sm:px-8 sm:py-12"
        >
          {/* Ambient radial gold & sage glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#C5A059]/15 blur-[110px]" />
            <div className="absolute bottom-0 left-1/2 h-[360px] w-[480px] -translate-x-1/2 rounded-full bg-[#4A6358]/20 blur-[100px]" />
            {/* Ornamental botanical SVG background pattern */}
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.06]"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="botanical-grid"
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
              <rect width="100%" height="100%" fill="url(#botanical-grid)" />
            </svg>
          </div>

          {/* Outer Double Ornamental Frame */}
          <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C5A059]/30 sm:inset-6 sm:rounded-3xl" />
          <div className="pointer-events-none absolute inset-4 rounded-xl border border-[#C5A059]/15 sm:inset-8 sm:rounded-2xl" />

          {/* Top Header */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/35 bg-[#243830]/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[#E5D1A7] backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>The Wedding Celebration</span>
            </div>
          </motion.div>

          {/* Center Couple Monogram & Names */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative z-10 my-auto flex max-w-lg flex-col items-center py-6 text-center"
          >
            {/* Botanical Crest */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#C5A059]/40 bg-[#243830]/80 shadow-[0_0_30px_rgba(197,160,89,0.18)]">
              <span className="font-serif-luxury text-2xl font-semibold tracking-widest text-[#E5D1A7]">
                {WEDDING_CONFIG.couple.groom.nickname[0]}
                <span className="mx-0.5 text-sm text-[#C5A059]">&amp;</span>
                {WEDDING_CONFIG.couple.bride.nickname[0]}
              </span>
            </div>

            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-[#E5D1A7]/80">
              Undangan Pernikahan
            </p>

            <h1 className="font-serif-luxury text-5xl font-normal tracking-wide text-[#FAF7F2] sm:text-6xl md:text-7xl">
              {WEDDING_CONFIG.couple.groom.nickname}{" "}
              <span className="font-serif-luxury italic text-[#C5A059]">
                &amp;
              </span>{" "}
              {WEDDING_CONFIG.couple.bride.nickname}
            </h1>

            <div className="mt-4 flex items-center gap-3 text-xs tracking-[0.22em] text-[#E5D1A7]/90 sm:text-sm">
              <span className="h-[1px] w-8 bg-[#C5A059]/50" />
              <span>{WEDDING_CONFIG.couple.weddingDateDisplay}</span>
              <span className="h-[1px] w-8 bg-[#C5A059]/50" />
            </div>

            {/* Dedicated Guest Card */}
            <div className="mt-8 w-full max-w-md rounded-2xl border border-[#C5A059]/35 bg-[#FAF7F2]/95 px-6 py-6 text-[#222624] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[#4A6358]">
                Kepada Yth. Bapak/Ibu/Saudara/i
              </p>

              <div className="my-3 border-y border-[#C5A059]/25 py-3.5">
                <p className="font-serif-luxury text-2xl font-semibold tracking-wide text-[#1C2B24] sm:text-3xl">
                  {guestName}
                </p>

                {isRegistered && guestCategory && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-3 py-0.5 text-[11px] font-medium text-[#243830]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#C5A059]" />
                    <span>Tamu Terdaftar • {guestCategory}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-[#4A6358]">
                Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir
                dan memberikan doa restu pada hari bahagia kami.
              </p>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenClick}
                className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#243830] px-6 py-3.5 text-sm font-medium tracking-wider text-[#FAF7F2] shadow-lg shadow-[#243830]/25 transition-colors hover:bg-[#1C2B24] focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:ring-offset-2"
              >
                <MailOpen className="h-4 w-4 text-[#E5D1A7]" />
                <span>Buka Undangan</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Bottom Hashtag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative z-10 text-center text-[11px] tracking-[0.25em] text-[#E5D1A7]/60"
          >
            {WEDDING_CONFIG.couple.hashtag}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
