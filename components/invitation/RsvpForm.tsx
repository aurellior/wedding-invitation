"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { AttendanceStatus, Guest, RsvpRecord } from "@/types/wedding";

export interface RsvpFormProps {
  guestName: string;
  registeredGuest: Guest | null;
  initialRsvp: RsvpRecord | null;
}

const ATTENDANCE_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  subtitle: string;
}[] = [
  {
    value: "hadir",
    label: "Ya, Saya Akan Hadir",
    subtitle: "InsyaAllah hadir di hari bahagia",
  },
  {
    value: "tidak_hadir",
    label: "Maaf, Berhalangan Hadir",
    subtitle: "Mengirimkan doa terbaik dari jauh",
  },
  {
    value: "ragu",
    label: "Masih Ragu / Menyesuaikan",
    subtitle: "Akan mengabari kembali secepatnya",
  },
];

export default function RsvpForm({
  registeredGuest,
  initialRsvp,
}: RsvpFormProps) {
  const [savedRsvp, setSavedRsvp] = useState<RsvpRecord | null>(initialRsvp);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(
    initialRsvp?.attendance_status ?? "hadir"
  );
  const [pax, setPax] = useState<number>(() => {
    if (initialRsvp) {
      return initialRsvp.attendance_status === "tidak_hadir"
        ? 0
        : Math.max(1, initialRsvp.pax);
    }
    return 1;
  });
  const [notes, setNotes] = useState<string>(initialRsvp?.notes ?? "");
  const [website, setWebsite] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const maxPaxAllowed = registeredGuest
    ? Math.max(1, registeredGuest.max_pax)
    : 1;
  const paxOptions = Array.from({ length: maxPaxAllowed }, (_, i) => i + 1);

  const handleStatusChange = (status: AttendanceStatus) => {
    setAttendanceStatus(status);
    if (status === "tidak_hadir") {
      setPax(0);
    } else if (pax < 1) {
      setPax(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!registeredGuest) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guest_id: registeredGuest.id,
          guest_name: registeredGuest.name,
          attendance_status: attendanceStatus,
          pax: attendanceStatus === "tidak_hadir" ? 0 : pax,
          notes: notes.trim() || null,
          website,
        }),
      });

      const result = (await response.json()) as {
        data?: RsvpRecord;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.data) {
        setErrorMsg(
          result.error ??
            "Gagal menyimpan konfirmasi kehadiran. Silakan coba lagi."
        );
        return;
      }

      setSavedRsvp(result.data);
      setSuccessMsg(
        result.message ??
          "Terima kasih! Konfirmasi kehadiran Anda telah berhasil tercatat."
      );
    } catch {
      setErrorMsg("Terjadi gangguan jaringan saat mengirim konfirmasi RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatStatusBadge = (status: AttendanceStatus) => {
    if (status === "hadir") {
      return {
        label: "Hadir",
        className:
          "border-emerald-700/30 bg-emerald-900/10 text-emerald-900",
      };
    }
    if (status === "tidak_hadir") {
      return {
        label: "Berhalangan Hadir",
        className: "border-rose-700/30 bg-rose-900/10 text-rose-900",
      };
    }
    return {
      label: "Masih Ragu",
      className: "border-amber-700/30 bg-amber-900/10 text-amber-900",
    };
  };

  return (
    <section id="rsvp" className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] px-4 py-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#243830]">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
            Konfirmasi Kehadiran
          </span>
          <h2 className="mt-4 font-serif-luxury text-4xl font-semibold text-[#1C2B24] sm:text-5xl">
            RSVP Kehadiran
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#4A6358]">
            Kehadiran Anda merupakan kehormatan bagi kami. Mohon konfirmasikan
            rencana kehadiran Anda untuk membantu kami mempersiapkan tempat
            terbaik.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-10 overflow-hidden rounded-3xl border border-[#C5A059]/40 bg-[#FAF7F2] p-6 shadow-[0_16px_50px_rgba(36,56,48,0.08)] sm:p-10"
        >
          {registeredGuest ? (
            <>
              {/* Verified Guest Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C5A059]/25 pb-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/45 bg-[#243830] px-4 py-1.5 text-xs font-medium text-[#E5D1A7]">
                  <ShieldCheck className="h-4 w-4 text-[#C5A059]" />
                  <span>Undangan Resmi • {registeredGuest.category}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A6358]">
                  <Users className="h-4 w-4 text-[#C5A059]" />
                  <span>
                    Kuota Undangan: Maks. {registeredGuest.max_pax} Orang
                  </span>
                </div>
              </div>

              {/* Existing / Updated RSVP Status Banner */}
              <AnimatePresence mode="wait">
                {savedRsvp && (
                  <motion.div
                    key={savedRsvp.updated_at}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 rounded-2xl border border-[#C5A059]/40 bg-[#F2ECE1]/90 p-4 text-xs text-[#222624]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-semibold text-[#1C2B24]">
                        <CheckCircle2 className="h-4 w-4 text-[#243830]" />
                        <span>Status Kehadiran Tercatat:</span>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold ${
                          formatStatusBadge(savedRsvp.attendance_status)
                            .className
                        }`}
                      >
                        {formatStatusBadge(savedRsvp.attendance_status).label}
                        {savedRsvp.attendance_status !== "tidak_hadir"
                          ? ` • ${savedRsvp.pax} Orang`
                          : ""}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#4A6358]">
                      Anda dapat memperbarui konfirmasi kehadiran kapan saja
                      melalui formulir di bawah ini.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
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
                {/* Locked Guest Name */}
                <div>
                  <label
                    htmlFor="rsvp-guest-name"
                    className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#243830]"
                  >
                    <span>Nama Tamu Undangan</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-normal normal-case text-[#4A6358]">
                      <Lock className="h-3 w-3 text-[#C5A059]" />
                      Sesuai undangan personal
                    </span>
                  </label>
                  <input
                    id="rsvp-guest-name"
                    type="text"
                    value={registeredGuest.name}
                    readOnly
                    className="mt-2 w-full cursor-not-allowed rounded-xl border border-[#C5A059]/35 bg-[#F2ECE1] px-4 py-3 text-sm font-semibold text-[#1C2B24] focus:outline-none"
                  />
                </div>

                {/* Attendance Status Selector */}
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Konfirmasi Kehadiran
                  </span>
                  <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {ATTENDANCE_OPTIONS.map((option) => {
                      const isSelected = attendanceStatus === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleStatusChange(option.value)}
                          className={`flex cursor-pointer flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-[#243830] bg-[#243830] text-[#FAF7F2] shadow-md"
                              : "border-[#C5A059]/35 bg-[#FAF7F2] text-[#222624] hover:border-[#C5A059] hover:bg-[#F2ECE1]/60"
                          }`}
                        >
                          <span className="text-xs font-semibold">
                            {option.label}
                          </span>
                          <span
                            className={`mt-1 text-[11px] leading-snug ${
                              isSelected ? "text-[#E5D1A7]" : "text-[#4A6358]"
                            }`}
                          >
                            {option.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Pax Selector */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="rsvp-pax"
                      className="text-xs font-semibold uppercase tracking-wider text-[#243830]"
                    >
                      Jumlah Tamu yang Hadir (Pax)
                    </label>
                    <span className="text-[11px] text-[#4A6358]">
                      Maksimal {registeredGuest.max_pax} orang
                    </span>
                  </div>

                  {attendanceStatus === "tidak_hadir" ? (
                    <div className="mt-2 rounded-xl border border-[#C5A059]/30 bg-[#F2ECE1]/70 px-4 py-3 text-xs text-[#4A6358]">
                      Jumlah kehadiran otomatis diatur ke{" "}
                      <strong className="text-[#1C2B24]">0 orang</strong> karena
                      Anda memilih berhalangan hadir.
                    </div>
                  ) : (
                    <select
                      id="rsvp-pax"
                      value={pax}
                      onChange={(e) => setPax(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-3 text-sm font-medium text-[#1C2B24] focus:border-[#243830] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                    >
                      {paxOptions.map((num) => (
                        <option key={num} value={num}>
                          {num} Orang
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Optional Notes */}
                <div>
                  <label
                    htmlFor="rsvp-notes"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                  >
                    Catatan Tambahan{" "}
                    <span className="font-normal normal-case text-[#4A6358]">
                      (Opsional)
                    </span>
                  </label>
                  <textarea
                    id="rsvp-notes"
                    rows={3}
                    maxLength={300}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tuliskan pesan singkat atau catatan kehadiran..."
                    className="mt-2 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-3 text-sm text-[#1C2B24] placeholder:text-[#4A6358]/60 focus:border-[#243830] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                  />
                </div>

                {/* Validation / Feedback Alerts */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-900"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-emerald-600/40 bg-emerald-50 p-4 text-xs text-emerald-950"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <div>
                        <p className="font-semibold">{successMsg}</p>
                        <p className="mt-0.5 text-[11px] text-emerald-800">
                          Konfirmasi tercatat atas nama{" "}
                          <strong>{registeredGuest.name}</strong>. Sampai
                          berjumpa di hari bahagia kami!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#243830] px-6 py-4 text-sm font-semibold tracking-wider text-[#FAF7F2] shadow-lg shadow-[#243830]/20 transition-all hover:bg-[#1C2B24] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-[#E5D1A7]" />
                      <span>Menyimpan Konfirmasi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 text-[#E5D1A7]" />
                      <span>
                        {savedRsvp
                          ? "Perbarui Konfirmasi Kehadiran"
                          : "Kirim Konfirmasi Kehadiran"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Formal Production Notice when opened without registered personal invitation link */
            <div className="py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#C5A059]/40 bg-[#F2ECE1] text-[#243830]">
                <Lock className="h-6 w-6 text-[#C5A059]" />
              </div>

              <h3 className="mt-4 font-serif-luxury text-2xl font-semibold text-[#1C2B24] sm:text-3xl">
                Konfirmasi Kehadiran Khusus Tamu Terdaftar
              </h3>

              <p className="mx-auto mt-2.5 max-w-lg text-xs leading-relaxed text-[#4A6358] sm:text-sm">
                Formulir konfirmasi kehadiran (RSVP) ini terhubung langsung
                dengan daftar tamu resmi mempelai. Silakan akses halaman
                undangan melalui tautan personal yang telah kami kirimkan kepada
                Anda melalui pesan WhatsApp.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
