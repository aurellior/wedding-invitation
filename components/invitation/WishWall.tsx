"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareHeart,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateId, truncateText } from "@/lib/utils/format";
import type { Guest, WishRecord } from "@/types/wedding";

export interface WishWallProps {
  initialWishes: WishRecord[];
  defaultSenderName: string;
  registeredGuest: Guest | null;
}

interface OptimisticWish extends WishRecord {
  isOptimistic?: boolean;
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "TU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function WishWall({
  initialWishes,
  defaultSenderName,
  registeredGuest,
}: WishWallProps) {
  const [wishes, setWishes] = useState<OptimisticWish[]>(initialWishes);
  const [senderName, setSenderName] = useState<string>(
    registeredGuest?.name ??
      (defaultSenderName !== "Tamu Undangan" ? defaultSenderName : "")
  );
  const [message, setMessage] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Subscribe to Supabase Realtime postgres_changes on `wishes` table when configured
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("public:wishes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wishes" },
        (payload) => {
          const newWish = payload.new as WishRecord;
          if (!newWish?.id) return;
          setWishes((prev) => {
            if (prev.some((w) => w.id === newWish.id)) {
              return prev;
            }
            return [newWish, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "wishes" },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (!deletedId) return;
          setWishes((prev) => prev.filter((w) => w.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanSender = (registeredGuest?.name ?? senderName).trim();
    const cleanMessage = message.trim();

    if (!cleanSender) {
      setErrorMsg("Mohon tuliskan nama Anda terlebih dahulu.");
      return;
    }

    if (cleanMessage.length < 2) {
      setErrorMsg("Mohon tuliskan ucapan dan doa restu Anda.");
      return;
    }

    const tempId = `optimistic-${Date.now()}`;
    const optimisticWish: OptimisticWish = {
      id: tempId,
      guest_id: registeredGuest?.id ?? null,
      sender_name: cleanSender,
      message: cleanMessage,
      attendance_badge: null,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic UI update: prepend immediately
    setWishes((prev) => [optimisticWish, ...prev]);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/wishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guest_id: registeredGuest?.id ?? null,
          sender_name: cleanSender,
          message: cleanMessage,
          website,
        }),
      });

      const result = (await response.json()) as {
        data?: WishRecord;
        wishes?: WishRecord[];
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.data) {
        // Rollback optimistic item on error
        setWishes((prev) => prev.filter((w) => w.id !== tempId));
        setErrorMsg(
          result.error ?? "Gagal mengirim ucapan. Silakan coba kembali."
        );
        return;
      }

      const savedWish = result.data;
      setWishes((prev) => {
        const withoutTemp = prev.filter(
          (w) => w.id !== tempId && w.id !== savedWish.id
        );
        return [savedWish, ...withoutTemp];
      });

      setMessage("");
      setSuccessMsg(
        result.message ?? "Terima kasih atas ucapan dan doa restu Anda!"
      );
    } catch {
      setWishes((prev) => prev.filter((w) => w.id !== tempId));
      setErrorMsg("Terjadi kesalahan jaringan saat mengirim ucapan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="ucapan"
      className="relative bg-[#F2ECE1]/70 py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#FAF7F2] px-4 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#243830]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            Untaian Doa &amp; Harapan
          </span>
          <h2 className="mt-4 font-serif-luxury text-4xl font-semibold text-[#1C2B24] sm:text-5xl">
            Ucapan &amp; Doa Restu
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#4A6358]">
            Kirimkan doa dan harapan tulus Anda untuk mengiringi langkah awal
            kehidupan rumah tangga kami.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Wish Submission Form */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <div className="rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2] p-6 shadow-md sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-[#C5A059]/25 pb-4">
                <MessageSquareHeart className="h-5 w-5 text-[#C5A059]" />
                <h3 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Tulis Ucapan
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Honeypot anti-bot field */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                <div>
                  <label
                    htmlFor="wish-sender-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                  >
                    Nama Pengirim
                  </label>
                  <input
                    id="wish-sender-name"
                    type="text"
                    maxLength={100}
                    value={registeredGuest ? registeredGuest.name : senderName}
                    readOnly={Boolean(registeredGuest)}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nama lengkap Anda / Keluarga"
                    className={`mt-1.5 w-full rounded-xl border border-[#C5A059]/40 px-4 py-2.5 text-sm text-[#1C2B24] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 ${
                      registeredGuest
                        ? "cursor-not-allowed bg-[#F2ECE1] font-semibold"
                        : "bg-[#FAF7F2]"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="wish-message"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                    >
                      Doa &amp; Ucapan
                    </label>
                    <span className="text-[11px] text-[#4A6358]">
                      {message.length}/500
                    </span>
                  </div>
                  <textarea
                    id="wish-message"
                    rows={4}
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tuliskan doa dan harapan terbaik untuk kedua mempelai..."
                    className="mt-1.5 w-full rounded-xl border border-[#C5A059]/40 bg-[#FAF7F2] px-4 py-3 text-sm text-[#1C2B24] placeholder:text-[#4A6358]/60 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                  />
                </div>

                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-50 p-3 text-xs text-rose-900"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 rounded-xl border border-emerald-600/40 bg-emerald-50 p-3 text-xs text-emerald-900"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#243830] px-5 py-3.5 text-sm font-semibold tracking-wider text-[#FAF7F2] shadow-md transition-colors hover:bg-[#1C2B24] disabled:opacity-60"
                >
                  <Send className="h-4 w-4 text-[#E5D1A7]" />
                  <span>
                    {isSubmitting ? "Mengirim Ucapan..." : "Kirim Doa Restu"}
                  </span>
                </button>
              </form>
            </div>
          </motion.div>

          {/* Right Column: Live Scrollable Feed */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            <div className="flex h-full flex-col rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2] p-6 shadow-md sm:p-8">
              <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-4">
                <div>
                  <h3 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                    Dinding Doa Restu
                  </h3>
                  <p className="text-xs text-[#4A6358]">
                    Diperbarui secara langsung (Realtime)
                  </p>
                </div>
                <span className="rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-3.5 py-1 text-xs font-semibold text-[#243830]">
                  {wishes.length} Ucapan
                </span>
              </div>

              <div className="mt-5 max-h-[460px] space-y-4 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {wishes.map((wish) => (
                    <motion.article
                      key={wish.id}
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-2xl border p-4 transition-colors ${
                        wish.isOptimistic
                          ? "border-[#C5A059] bg-[#F2ECE1]/70"
                          : "border-[#C5A059]/25 bg-[#FAF7F2] hover:border-[#C5A059]/50"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/40 bg-[#243830] font-serif-luxury text-sm font-semibold text-[#E5D1A7]">
                          {getInitials(wish.sender_name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4
                              className="max-w-[180px] truncate text-sm font-semibold text-[#1C2B24] sm:max-w-[240px]"
                              title={wish.sender_name}
                            >
                              {truncateText(wish.sender_name, 20)}
                            </h4>
                            <div className="flex items-center gap-2">
                              {wish.isOptimistic && (
                                <span className="inline-flex items-center gap-1 text-[10px] italic text-[#4A6358]">
                                  <Clock className="h-3 w-3 animate-pulse text-[#C5A059]" />
                                  Mengirim...
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 text-xs leading-relaxed text-[#222624] sm:text-sm">
                            {wish.message}
                          </p>

                          <p className="mt-2.5 text-[11px] text-[#4A6358]">
                            {formatDateId(wish.created_at, "Baru saja")}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>

                {wishes.length === 0 && (
                  <div className="py-12 text-center text-sm text-[#4A6358]">
                    Belum ada ucapan. Jadilah yang pertama mengirimkan doa restu
                    untuk mempelai!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
