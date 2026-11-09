"use client";

import React, { useState } from "react";
import CoverOverlay from "@/components/invitation/CoverOverlay";
import AudioController from "@/components/invitation/AudioController";
import {
  DEFAULT_WEDDING_CONFIG,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";
import type { GuestCategory } from "@/types/wedding";

export interface InvitationClientShellProps {
  guestName: string;
  guestCategory?: GuestCategory | null;
  isRegistered?: boolean;
  config?: WeddingContentConfig;
  children: React.ReactNode;
}

export default function InvitationClientShell({
  guestName,
  guestCategory,
  isRegistered = false,
  config = DEFAULT_WEDDING_CONFIG,
  children,
}: InvitationClientShellProps) {
  const [isCoverOpen, setIsCoverOpen] = useState<boolean>(false);

  return (
    <div className="relative min-h-screen bg-[#FAF7F2] text-[#222624]">
      {/* Full-Screen Editorial Letterpress Cover Overlay */}
      <CoverOverlay
        guestName={guestName}
        guestCategory={guestCategory}
        isRegistered={isRegistered}
        isOpened={isCoverOpen}
        onOpenInvitation={() => setIsCoverOpen(true)}
        config={config}
      />

      {/* Main Invitation Content */}
      <div>{children}</div>

      {/* Floating Audio Controller (MP3 + Web Audio Synthesizer Fallback) */}
      <AudioController isOpened={isCoverOpen} audioConfig={config.audio} />
    </div>
  );
}
