"use client";

import React, { useState } from "react";
import CoverOverlay from "@/components/invitation/CoverOverlay";
import AudioController from "@/components/invitation/AudioController";
import type { GuestCategory } from "@/types/wedding";

export interface InvitationClientShellProps {
  guestName: string;
  guestCategory?: GuestCategory | null;
  isRegistered?: boolean;
  children: React.ReactNode;
}

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

      {/* Main Invitation Content */}
      <main>{children}</main>

      {/* Floating Audio Controller (MP3 + Web Audio Synthesizer Fallback) */}
      <AudioController isOpened={isCoverOpen} />
    </div>
  );
}
