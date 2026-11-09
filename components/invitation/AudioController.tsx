"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disc3, Volume2, VolumeX, Pause, Play } from "lucide-react";
import { WEDDING_CONFIG } from "@/lib/config/wedding-config";

export interface AudioControllerProps {
  isOpened: boolean;
}

// Romantic arpeggio notes (frequencies in Hz) - Clair de Lune inspired progression
// Chords: Cmaj7 -> Am9 -> Fmaj7 -> G6
const ROMANTIC_ARPEGGIO_SEQUENCE: number[] = [
  261.63, // C4
  329.63, // E4
  392.0,  // G4
  493.88, // B4
  523.25, // C5
  392.0,  // G4
  220.0,  // A3
  261.63, // C4
  329.63, // E4
  440.0,  // A4
  493.88, // B4
  329.63, // E4
  174.61, // F3
  261.63, // C4
  349.23, // F4
  440.0,  // A4
  523.25, // C5
  349.23, // F4
  196.0,  // G3
  246.94, // B3
  293.66, // D4
  392.0,  // G4
  440.0,  // A4
  293.66, // D4
];

export default function AudioController({ isOpened }: AudioControllerProps) {
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

    // Warm music-box / celesta tone: sine + soft triangle octave
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    // Gentle envelope
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

    // Play first note immediately
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
      // Fallback to gentle Web Audio API romantic arpeggio synthesizer if MP3 fails or is missing
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
      const timer = setTimeout(() => setShowTooltip(false), 4500);
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
    // Only trigger when isOpened transitions to true
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
        src={WEDDING_CONFIG.audio.src}
        loop
        preload="none"
        onError={() => {
          // If external MP3 fails to load, switch seamlessly to Web Audio synth
          if (isOpened) {
            startSynthFallback();
          } else {
            setUsingSynthFallback(true);
          }
        }}
      />

      <div
        className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="pointer-events-none max-w-[230px] rounded-xl border border-[#C5A059]/40 bg-[#1C2B24]/95 px-3.5 py-2 text-right text-xs text-[#FAF7F2] shadow-lg backdrop-blur-md"
            >
              <p className="font-medium text-[#E5D1A7]">
                {WEDDING_CONFIG.audio.title}
              </p>
              <p className="text-[10px] text-[#FAF7F2]/70">
                {usingSynthFallback
                  ? "Ambient Romantic Suite (Synthesizer)"
                  : WEDDING_CONFIG.audio.artist}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 rounded-full border border-[#C5A059]/45 bg-[#1C2B24]/90 p-1.5 text-[#FAF7F2] shadow-[0_10px_30px_rgba(28,43,36,0.35)] backdrop-blur-md">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Bunyikan musik" : "Bisukan musik"}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#E5D1A7] transition-colors hover:bg-[#243830] focus:outline-none"
            title={isMuted ? "Unmute" : "Mute"}
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
            className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#C5A059] text-[#1C2B24] shadow-md transition-transform hover:scale-105 focus:outline-none"
            title={isPlaying ? "Pause Musik" : "Putar Musik"}
          >
            <motion.div
              animate={isPlaying && !isMuted ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isPlaying && !isMuted
                  ? { duration: 6, repeat: Infinity, ease: "linear" }
                  : { duration: 0.3 }
              }
              className="flex items-center justify-center"
            >
              <Disc3 className="h-5 w-5" />
            </motion.div>
            <span className="sr-only">
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
