"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import {
  DEFAULT_WEDDING_CONFIG,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";

export interface AudioControllerProps {
  isOpened: boolean;
  audioConfig?: WeddingContentConfig["audio"];
}

// Romantic arpeggio notes (frequencies in Hz) - Clair de Lune inspired progression
const ROMANTIC_ARPEGGIO_SEQUENCE: number[] = [
  261.63, // C4
  329.63, // E4
  392.0, // G4
  493.88, // B4
  523.25, // C5
  392.0, // G4
  220.0, // A3
  261.63, // C4
  329.63, // E4
  440.0, // A4
  493.88, // B4
  329.63, // E4
  174.61, // F3
  261.63, // C4
  349.23, // F4
  440.0, // A4
  523.25, // C5
  349.23, // F4
  196.0, // G3
  246.94, // B3
  293.66, // D4
  392.0, // G4
  440.0, // A4
  293.66, // D4
];

export default function AudioController({
  isOpened,
  audioConfig = DEFAULT_WEDDING_CONFIG.audio,
}: AudioControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [usingSynthFallback, setUsingSynthFallback] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteIndexRef = useRef<number>(0);
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const stopSynth = useCallback(() => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  }, []);

  const playNote = useCallback((ctx: AudioContext, freq: number) => {
    if (isMutedRef.current) return;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 1.9);
    subOsc.stop(now + 1.9);
  }, []);

  const startSynthFallback = useCallback(() => {
    stopSynth();
    if (typeof window === "undefined") return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    setUsingSynthFallback(true);
    setIsPlaying(true);

    const initialFreq =
      ROMANTIC_ARPEGGIO_SEQUENCE[
        noteIndexRef.current % ROMANTIC_ARPEGGIO_SEQUENCE.length
      ];
    playNote(ctx, initialFreq);
    noteIndexRef.current += 1;

    synthIntervalRef.current = setInterval(() => {
      if (!audioCtxRef.current) return;
      const freq =
        ROMANTIC_ARPEGGIO_SEQUENCE[
          noteIndexRef.current % ROMANTIC_ARPEGGIO_SEQUENCE.length
        ];
      playNote(audioCtxRef.current, freq);
      noteIndexRef.current += 1;
    }, 680);
  }, [playNote, stopSynth]);

  const startPlayback = useCallback(async () => {
    if (usingSynthFallback) {
      startSynthFallback();
      return;
    }

    const audioEl = audioRef.current;
    if (!audioEl) {
      startSynthFallback();
      return;
    }

    try {
      audioEl.volume = 0.55;
      await audioEl.play();
      setIsPlaying(true);
    } catch {
      startSynthFallback();
    }
  }, [startSynthFallback, usingSynthFallback]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    stopSynth();
    setIsPlaying(false);
  }, [stopSynth]);

  const togglePlayPause = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      void startPlayback();
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    const handleUnlockAudio = () => {
      void startPlayback();
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("wedding:unlock-audio", handleUnlockAudio);
    return () => {
      window.removeEventListener("wedding:unlock-audio", handleUnlockAudio);
    };
  }, [startPlayback]);

  useEffect(() => {
    if (isOpened && !isPlaying) {
      void startPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpened]);

  useEffect(() => {
    return () => {
      stopSynth();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopSynth]);

  return (
    <>
      <audio
        ref={audioRef}
        src={audioConfig.src}
        loop
        preload="none"
        onError={() => {
          if (isOpened) {
            startSynthFallback();
          } else {
            setUsingSynthFallback(true);
          }
        }}
      />

      <div
        className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="pointer-events-none max-w-[230px] rounded-sm border border-[#C5A059]/45 bg-[#1C2B24] px-3.5 py-2 text-right text-xs text-[#FAF7F2] shadow-md"
            >
              <p className="font-medium text-[#E5D1A7]">{audioConfig.title}</p>
              <p className="text-[10px] text-[#FAF7F2]/75">
                {usingSynthFallback
                  ? "Ambient Romantic Suite"
                  : audioConfig.artist}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* R-03: 44x44px (h-11 w-11) touch targets on both audio controls */}
        <div className="flex items-center gap-1 rounded-sm border border-[#C5A059]/50 bg-[#1C2B24] p-1 text-[#FAF7F2] shadow-md">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Bunyikan musik" : "Bisukan musik"}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-[#E5D1A7] transition-colors hover:bg-[#243830]"
            title={isMuted ? "Bunyikan Musik" : "Bisukan Musik"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-rose-300" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Jeda musik latar" : "Putar musik latar"}
            className="flex h-11 w-11 items-center justify-center rounded-sm bg-[#C5A059] text-[#1C2B24] transition-colors hover:bg-[#E5D1A7]"
            title={isPlaying ? "Jeda Musik" : "Putar Musik"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
