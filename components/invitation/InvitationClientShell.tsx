"use client";

import React, { useState } from "react";
import {
  CalendarHeart,
  Gift,
  Heart,
  MessageSquareHeart,
  UserCheck,
} from "lucide-react";
import CoverOverlay from "@/components/invitation/CoverOverlay";
import AudioController from "@/components/invitation/AudioController";
import type { GuestCategory } from "@/types/wedding";

export interface InvitationClientShellProps {
  guestName: string;
  guestCategory?: GuestCategory | null;
  isRegistered?: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "#mempelai", label: "Mempelai", icon: Heart },
  { href: "#acara", label: "Acara", icon: CalendarHeart },
  { href: "#rsvp", label: "RSVP", icon: UserCheck },
  { href: "#ucapan", label: "Ucapan", icon: MessageSquareHeart },
  { href: "#hadiah", label: "Hadiah", icon: Gift },
];

export default function InvitationClientShell({
  guestName,
  guestCategory,
  isRegistered = false,
  children,
}: InvitationClientShellProps) {
  const [isCoverOpen, setIsCoverOpen] = useState<boolean>(false);

  return (
    <div className="relative min-h-screen bg-[#FAF7F2] text-[#222624]">
      {/* Full-Screen Luxury Botanical & Warm Ivory Cover Overlay */}
      <CoverOverlay
        guestName={guestName}
        guestCategory={guestCategory}
        isRegistered={isRegistered}
        isOpened={isCoverOpen}
        onOpenInvitation={() => setIsCoverOpen(true)}
      />

      {/* Subtle Top Bar with Guest Indicator */}
      <header className="sticky top-0 z-30 border-b border-[#C5A059]/25 bg-[#FAF7F2]/90 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#243830]">
            <span className="font-serif-luxury text-lg font-semibold tracking-wider text-[#1C2B24]">
              A &amp; N
            </span>
            <span className="h-3.5 w-[1px] bg-[#C5A059]/40" />
            <span className="truncate max-w-[240px] sm:max-w-md text-[#4A6358]">
              Kepada:{" "}
              <strong className="font-semibold text-[#1C2B24]">
                {guestName}
              </strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Invitation Content */}
      <main>{children}</main>

      {/* Floating Audio Controller (MP3 + Web Audio Synthesizer Fallback) */}
      <AudioController isOpened={isCoverOpen} />

      {/* Floating Bottom Navigation Pill Bar */}
      <nav
        aria-label="Navigasi Undangan"
        className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 px-3"
      >
        <div className="flex items-center gap-1 rounded-full border border-[#C5A059]/45 bg-[#1C2B24]/95 px-2.5 py-1.5 text-[#FAF7F2] shadow-[0_12px_35px_rgba(28,43,36,0.4)] backdrop-blur-md sm:gap-2 sm:px-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center rounded-full px-3 py-1.5 text-[10px] font-medium tracking-wide text-[#FAF7F2]/80 transition-colors hover:bg-[#243830] hover:text-[#E5D1A7] sm:flex-row sm:gap-1.5 sm:text-xs"
              >
                <Icon className="h-3.5 w-3.5 text-[#C5A059]" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
