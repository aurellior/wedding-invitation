"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquareHeart,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AttendanceStatus, Guest, WishRecord } from "@/types/wedding";

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

function formatIndonesianDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Baru saja";
  }
}

function renderAttendanceBadge(badge?: AttendanceStatus | null) {
  if (!badge) return null;

  if (badge === "hadir") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-700/30 bg-emerald-950/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
        Hadir
      </span>
    );
  }

  if (badge === "tidak_hadir") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-rose-700/30 bg-rose-950/10 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
        Berhalangan
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-amber-700/30 bg-amber-950/10 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
      Masih Ragu
    </span>
  );
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
  const [attendanceBadge, setAttendanceBadge] =
    useState<AttendanceStatus>("hadir");
  const [message, setMessage] = useState<string>("");
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
      attendance_badge: attendanceBadge,
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
          attendance_badge: attendanceBadge,
        }),
      });

      const result = (await response.json()) as {
        data?: WishRecord;
        wishes?: WishRecord[];
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.data) {
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
        result.message ?? "Terima kasih atas ucapan dan doa restu Anda."
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
      className="relative border-b border-[#C5A059]/25 bg-[#F2ECE1]/75 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Editorial Heading */}
        <div className="grid grid-cols-1 gap-6 border-b border-[#C5A059]/30 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6825]">
              V. Buku Tamu &amp; Doa Restu
            </p>
            <h2 className="mt-2 font-serif-luxury text-4xl font-semibold leading-[1.1] text-[#1C2B24] sm:text-5xl">
              Untaian Doa &amp; Harapan
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm leading-relaxed text-[#4A6358]">
              Kirimkan doa dan harapan tulus Anda untuk mengiringi langkah awal
              kehidupan rumah tangga kami.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Wish Submission Form */}
          <div className="lg:col-span-5">
            <div className="rounded-sm border border-[#C5A059]/40 bg-[#FAF7F2] p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-[#C5A059]/25 pb-4">
                <MessageSquareHeart className="h-5 w-5 text-[#8A6825]" />
                <h3 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Tulis Ucapan
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                    className={`mt-1.5 min-h-11 w-full rounded-sm border border-[#C5A059]/45 px-4 py-2.5 text-sm text-[#1C2B24] ${
                      registeredGuest
                        ? "cursor-not-allowed bg-[#F2ECE1] font-semibold"
                        : "bg-[#FAF7F2]"
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="wish-attendance"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                  >
                    Keterangan Kehadiran
                  </label>
                  <select
                    id="wish-attendance"
                    value={attendanceBadge}
                    onChange={(e) =>
                      setAttendanceBadge(e.target.value as AttendanceStatus)
                    }
                    className="mt-1.5 min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#1C2B24]"
                  >
                    <option value="hadir">Hadir</option>
                    <option value="tidak_hadir">Berhalangan Hadir</option>
                    <option value="ragu">Masih Ragu</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="wish-message"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                    >
                      Doa &amp; Ucapan
                    </label>
                    <span className="text-[11px] text-[#4A6358] tabular-nums">
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
                    className="mt-1.5 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-3 text-sm text-[#1C2B24] placeholder:text-[#4A6358]/60"
                  />
                </div>

                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 rounded-sm border border-rose-600/40 bg-rose-50 p-3 text-xs text-rose-900"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      role="status"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 rounded-sm border border-emerald-700/40 bg-emerald-50 p-3 text-xs text-emerald-900"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#243830] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24] disabled:opacity-60"
                >
                  <Send className="h-4 w-4 text-[#E5D1A7]" />
                  <span>
                    {isSubmitting ? "Mengirim Ucapan..." : "Kirim Doa Restu"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Editorial Guestbook Ledger */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col rounded-sm border border-[#C5A059]/40 bg-[#FAF7F2] p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-4">
                <div>
                  <h3 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                    Lembar Doa Restu
                  </h3>
                  <p className="text-xs text-[#4A6358]">
                    Catatan kehadiran &amp; doa dari kerabat serta sahabat
                  </p>
                </div>
                <span className="rounded-sm border border-[#C5A059]/45 bg-[#F2ECE1] px-3 py-1 text-xs font-semibold text-[#243830] tabular-nums">
                  {wishes.length} Ucapan
                </span>
              </div>

              <div className="mt-2 max-h-[460px] divide-y divide-[#C5A059]/25 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {wishes.map((wish) => (
                    <motion.article
                      key={wish.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`py-4 transition-colors ${
                        wish.isOptimistic ? "bg-[#F2ECE1]/60 px-3" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[#C5A059]/40 bg-[#243830] font-serif-luxury text-xs font-semibold text-[#E5D1A7]">
                          {getInitials(wish.sender_name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-[#1C2B24]">
                              {wish.sender_name}
                            </h4>
                            <div className="flex items-center gap-2">
                              {renderAttendanceBadge(wish.attendance_badge)}
                              {wish.isOptimistic && (
                                <span className="inline-flex items-center gap-1 text-[10px] italic text-[#4A6358]">
                                  <Clock className="h-3 w-3 text-[#8A6825]" />
                                  Mengirim...
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-1.5 text-xs leading-relaxed text-[#222624] sm:text-sm">
                            {wish.message}
                          </p>

                          <p className="mt-2 text-[11px] text-[#4A6358] tabular-nums">
                            {formatIndonesianDate(wish.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>

                {wishes.length === 0 && (
                  <div className="py-12 text-center text-sm text-[#4A6358]">
                    Belum ada catatan doa. Silakan tuliskan ucapan pertama untuk
                    kedua mempelai.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
