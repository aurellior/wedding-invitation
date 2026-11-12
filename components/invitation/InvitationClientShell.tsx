"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, ArrowLeft } from "lucide-react";
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
  isPreviewMode?: boolean;
  config?: WeddingContentConfig;
  children: React.ReactNode;
}

export default function InvitationClientShell({
  guestName,
  guestCategory,
  isRegistered = false,
  isPreviewMode = false,
  config = DEFAULT_WEDDING_CONFIG,
  children,
}: InvitationClientShellProps) {
  const [isCoverOpen, setIsCoverOpen] = useState<boolean>(false);

  return (
    <div className="relative min-h-screen bg-[#FAF7F2] text-[#222624]">
      {/* Floating Admin Preview Indicator Banner */}
      {isPreviewMode && (
        <div className="fixed top-3 left-1/2 z-[60] -translate-x-1/2 px-3 w-full max-w-md pointer-events-none flex justify-center">
          <div className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full border border-[#C5A059]/60 bg-[#1C2B24]/95 px-4 py-1.5 text-[11px] font-medium text-[#FAF7F2] shadow-lg backdrop-blur-md">
            <span className="inline-flex items-center gap-1.5 text-[#E5D1A7]">
              <Eye className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>Mode Preview Admin</span>
            </span>
            <span className="text-[#C5A059]/40">•</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[#FAF7F2]/90 underline-offset-2 hover:text-[#E5D1A7] hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Ke Back-Office</span>
            </Link>
          </div>
        </div>
      )}

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
