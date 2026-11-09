"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Lock,
  ShieldCheck,
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
    subtitle: "InsyaAllah hadir pada hari bahagia",
  },
  {
    value: "tidak_hadir",
    label: "Maaf, Berhalangan Hadir",
    subtitle: "Mengirimkan doa restu dari jauh",
  },
  {
    value: "ragu",
    label: "Masih Menyesuaikan Jadwal",
    subtitle: "Akan mengabari kepastian kehadiran",
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
          "Terima kasih. Konfirmasi kehadiran Anda telah tercatat."
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
        className: "border-emerald-700/35 bg-emerald-950/10 text-emerald-900",
      };
    }
    if (status === "tidak_hadir") {
      return {
        label: "Berhalangan Hadir",
        className: "border-rose-700/35 bg-rose-950/10 text-rose-900",
      };
    }
    return {
      label: "Masih Ragu",
      className: "border-amber-700/35 bg-amber-950/10 text-amber-900",
    };
  };

  return (
    <section
      id="rsvp"
      className="relative border-b border-[#C5A059]/25 bg-[#FAF7F2] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Editorial Intro & Guest Accreditation */}
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6825]">
              IV. Konfirmasi Kehadiran
            </p>
            <h2 className="mt-2 font-serif-luxury text-4xl font-semibold leading-[1.1] text-[#1C2B24] sm:text-5xl">
              Lembar RSVP
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4A6358]">
              Kehadiran Anda merupakan kehormatan bagi keluarga kami. Mohon
              konfirmasikan rencana kehadiran Anda untuk membantu penataan kursi
              dan jamuan resepsi.
            </p>

            {registeredGuest && (
              <div className="mt-7 rounded-sm border border-[#C5A059]/40 bg-[#F2ECE1]/70 p-5">
                <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-3 text-xs font-semibold text-[#1C2B24]">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#8A6825]" />
                    <span>Tamu Terdaftar</span>
                  </span>
                  <span className="rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-[#243830]">
                    {registeredGuest.category}
                  </span>
                </div>

                <dl className="mt-3.5 space-y-2 text-xs text-[#222624]">
                  <div className="flex items-center justify-between">
                    <dt className="text-[#4A6358]">Nama Undangan</dt>
                    <dd className="font-semibold text-[#1C2B24]">
                      {registeredGuest.name}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#4A6358]">Kuota Kursi</dt>
                    <dd className="inline-flex items-center gap-1 font-semibold text-[#243830] tabular-nums">
                      <Users className="h-3.5 w-3.5 text-[#8A6825]" />
                      <span>Maks. {registeredGuest.max_pax} Orang</span>
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {/* Right Column: Stationery RSVP Form */}
          <div className="lg:col-span-7">
            <div className="rounded-sm border border-[#C5A059]/40 bg-[#FAF7F2] p-6 sm:p-9">
              {registeredGuest ? (
                <>
                  {/* Existing / Updated RSVP Status Banner */}
                  <AnimatePresence mode="wait">
                    {savedRsvp && (
                      <motion.div
                        key={savedRsvp.updated_at}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6 rounded-sm border border-[#C5A059]/40 bg-[#F2ECE1] p-4 text-xs text-[#222624]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-semibold text-[#1C2B24]">
                            <CheckCircle2 className="h-4 w-4 text-[#243830]" />
                            <span>Status Kehadiran Tercatat:</span>
                          </div>
                          <span
                            className={`rounded-sm border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                              formatStatusBadge(savedRsvp.attendance_status)
                                .className
                            }`}
                          >
                            {
                              formatStatusBadge(savedRsvp.attendance_status)
                                .label
                            }
                            {savedRsvp.attendance_status !== "tidak_hadir"
                              ? ` • ${savedRsvp.pax} Orang`
                              : ""}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#4A6358]">
                          Anda dapat memperbarui konfirmasi kehadiran melalui
                          formulir di bawah ini.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Locked Guest Name */}
                    <div>
                      <label
                        htmlFor="rsvp-guest-name"
                        className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#243830]"
                      >
                        <span>Nama Tamu Undangan</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-normal normal-case text-[#4A6358]">
                          <Lock className="h-3 w-3 text-[#8A6825]" />
                          Sesuai undangan personal
                        </span>
                      </label>
                      <input
                        id="rsvp-guest-name"
                        type="text"
                        value={registeredGuest.name}
                        readOnly
                        className="mt-2 min-h-11 w-full cursor-not-allowed rounded-sm border border-[#C5A059]/35 bg-[#F2ECE1] px-4 py-2.5 text-sm font-semibold text-[#1C2B24]"
                      />
                    </div>

                    {/* Attendance Status Selector */}
                    <fieldset>
                      <legend className="block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                        Konfirmasi Kehadiran
                      </legend>
                      <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {ATTENDANCE_OPTIONS.map((option) => {
                          const isSelected = attendanceStatus === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => handleStatusChange(option.value)}
                              className={`flex min-h-11 flex-col items-start justify-between rounded-sm border p-3.5 text-left transition-colors ${
                                isSelected
                                  ? "border-[#243830] bg-[#243830] text-[#FAF7F2]"
                                  : "border-[#C5A059]/40 bg-[#FAF7F2] text-[#222624] hover:border-[#243830] hover:bg-[#F2ECE1]/60"
                              }`}
                            >
                              <span className="text-xs font-semibold">
                                {option.label}
                              </span>
                              <span
                                className={`mt-1 text-[11px] leading-snug ${
                                  isSelected
                                    ? "text-[#E5D1A7]"
                                    : "text-[#4A6358]"
                                }`}
                              >
                                {option.subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Dynamic Pax Selector */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="rsvp-pax"
                          className="text-xs font-semibold uppercase tracking-wider text-[#243830]"
                        >
                          Jumlah Kehadiran (Pax)
                        </label>
                        <span className="text-[11px] text-[#4A6358] tabular-nums">
                          Maksimal {registeredGuest.max_pax} orang
                        </span>
                      </div>

                      {attendanceStatus === "tidak_hadir" ? (
                        <div className="mt-2 rounded-sm border border-[#C5A059]/35 bg-[#F2ECE1]/70 px-4 py-3 text-xs text-[#4A6358]">
                          Jumlah kehadiran diatur ke{" "}
                          <strong className="text-[#1C2B24] tabular-nums">
                            0 orang
                          </strong>{" "}
                          karena Anda memilih berhalangan hadir.
                        </div>
                      ) : (
                        <select
                          id="rsvp-pax"
                          value={pax}
                          onChange={(e) => setPax(Number(e.target.value))}
                          className="mt-2 min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-2.5 text-sm font-medium text-[#1C2B24] tabular-nums"
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
                        placeholder="Tuliskan catatan khusus apabila diperlukan..."
                        className="mt-2 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-3 text-sm text-[#1C2B24] placeholder:text-[#4A6358]/60"
                      />
                    </div>

                    {/* Validation / Feedback Alerts */}
                    <AnimatePresence>
                      {errorMsg && (
                        <motion.div
                          role="alert"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-start gap-2.5 rounded-sm border border-rose-600/40 bg-rose-50 p-3.5 text-xs text-rose-900"
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
                          className="flex items-start gap-2.5 rounded-sm border border-emerald-700/40 bg-emerald-50 p-4 text-xs text-emerald-950"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                          <div>
                            <p className="font-semibold">{successMsg}</p>
                            <p className="mt-0.5 text-[11px] text-emerald-800">
                              Konfirmasi tercatat atas nama{" "}
                              <strong>{registeredGuest.name}</strong>.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#243830] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24] disabled:opacity-60"
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
                <div className="py-6 text-left sm:py-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#C5A059]/45 bg-[#F2ECE1] text-[#243830]">
                    <Lock className="h-5 w-5 text-[#8A6825]" />
                  </div>

                  <h3 className="mt-4 font-serif-luxury text-2xl font-semibold text-[#1C2B24] sm:text-3xl">
                    Konfirmasi Kehadiran Khusus Tamu Terdaftar
                  </h3>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#4A6358] sm:text-sm">
                    Formulir konfirmasi kehadiran (RSVP) ini terhubung langsung
                    dengan daftar tamu resmi mempelai. Silakan akses halaman
                    undangan melalui tautan personal yang telah kami kirimkan
                    melalui pesan WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
