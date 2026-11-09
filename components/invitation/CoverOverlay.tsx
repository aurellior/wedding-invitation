"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MailOpen, ShieldCheck } from "lucide-react";
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="cover-couple-title"
          initial={{ opacity: 1, y: 0 }}
          exit={{
            y: "-100%",
            opacity: 0,
            transition: {
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto bg-[#1C2B24] px-5 py-7 text-[#FAF7F2] sm:px-10 sm:py-10"
        >
          {/* Subtle architectural paper grain & fine linework (no blurred radial orbs) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.045]"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="stationery-lattice"
                  width="72"
                  height="72"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M36 0 L36 72 M0 36 L72 36"
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="0.6"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stationery-lattice)" />
            </svg>
          </div>

          {/* Architectural Letterpress Double Frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 rounded-sm border border-[#C5A059]/35 sm:inset-6"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 rounded-sm border border-[#C5A059]/15 sm:inset-7"
          />

          {/* Top Editorial Folio Bar */}
          <div className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between border-b border-[#C5A059]/25 pb-3 text-[11px] uppercase tracking-[0.24em] text-[#E5D1A7]/85">
            <span>Undangan Pernikahan</span>
            <span className="tabular-nums">{WEDDING_CONFIG.couple.shortDate}</span>
          </div>

          {/* Center Couple Typography & Dedicated Nameplate Slip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative z-10 mx-auto my-auto flex w-full max-w-xl flex-col items-center py-6 text-center"
          >
            {/* Letterpress Monogram Seal */}
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-sm border border-[#C5A059]/45 bg-[#243830]">
              <span className="font-serif-luxury text-2xl font-medium tracking-widest text-[#E5D1A7]">
                {WEDDING_CONFIG.couple.groom.nickname[0]}
                <span className="mx-0.5 text-sm italic text-[#C5A059]">&amp;</span>
                {WEDDING_CONFIG.couple.bride.nickname[0]}
              </span>
            </div>

            <h1
              id="cover-couple-title"
              className="font-serif-luxury text-5xl font-normal leading-[1.04] tracking-[-0.01em] text-[#FAF7F2] sm:text-6xl md:text-7xl"
            >
              {WEDDING_CONFIG.couple.groom.nickname}{" "}
              <span className="font-serif-luxury italic text-[#C5A059]">
                &amp;
              </span>{" "}
              {WEDDING_CONFIG.couple.bride.nickname}
            </h1>

            <p className="mt-3 text-xs font-medium uppercase tracking-[0.26em] text-[#E5D1A7]">
              {WEDDING_CONFIG.couple.weddingDateDisplay}
            </p>

            {/* Printed Guest Nameplate Card */}
            <div className="mt-8 w-full max-w-md rounded-md border border-[#C5A059]/45 bg-[#FAF7F2] px-6 py-6 text-left text-[#222624] sm:px-8 sm:py-7">
              <div className="flex items-center justify-between gap-2 border-b border-[#C5A059]/30 pb-2.5 text-[11px] uppercase tracking-[0.18em] text-[#4A6358]">
                <span>Kepada Yth. Bapak / Ibu / Saudara/i</span>
                {isRegistered && guestCategory && (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-[#C5A059]/45 bg-[#F2ECE1] px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#243830]">
                    <ShieldCheck className="h-3 w-3 text-[#C5A059]" />
                    <span>{guestCategory}</span>
                  </span>
                )}
              </div>

              <div className="py-4">
                <p className="font-serif-luxury text-2xl font-semibold leading-snug text-[#1C2B24] sm:text-3xl">
                  {guestName}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#4A6358]">
                  Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir
                  dan memberikan doa restu pada acara pernikahan kami.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenClick}
                className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-sm bg-[#243830] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A059]"
              >
                <MailOpen className="h-4 w-4 text-[#E5D1A7]" />
                <span>Buka Undangan</span>
              </button>
            </div>
          </motion.div>

          {/* Bottom Colophon */}
          <div className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between border-t border-[#C5A059]/25 pt-3 text-[11px] tracking-[0.2em] text-[#E5D1A7]/70">
            <span>The Dharmawangsa Jakarta</span>
            <span>{WEDDING_CONFIG.couple.hashtag}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
