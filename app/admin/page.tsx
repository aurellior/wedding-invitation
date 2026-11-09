import React from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UsersRound,
  MessageSquareHeart,
  Send,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Database,
} from "lucide-react";
import {
  getGuests,
  getRsvps,
  getWishes,
  isPostgresConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/repository";
import { WEDDING_CONFIG } from "@/lib/config/wedding-config";
import type { AttendanceStatus } from "@/types/wedding";

export const dynamic = "force-dynamic";

function formatDateId(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status?: AttendanceStatus | null }) {
  if (status === "hadir") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-700/30 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Hadir
      </span>
    );
  }
  if (status === "tidak_hadir") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-rose-700/30 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
        <XCircle className="h-3 w-3" />
        Tidak Hadir
      </span>
    );
  }
  if (status === "ragu") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-amber-700/30 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <HelpCircle className="h-3 w-3" />
        Masih Ragu
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
      <Clock className="h-3 w-3" />
      Menunggu
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [guests, rsvps, wishes] = await Promise.all([
    getGuests(),
    getRsvps(),
    getWishes(),
  ]);

  const attendingRsvps = rsvps.filter((r) => r.attendance_status === "hadir");
  const declinedRsvps = rsvps.filter(
    (r) => r.attendance_status === "tidak_hadir"
  );
  const metrics = {
    totalGuests: guests.length,
    totalAttendingRsvps: attendingRsvps.length,
    totalDeclinedRsvps: declinedRsvps.length,
    totalPendingGuests: Math.max(
      0,
      guests.length - attendingRsvps.length - declinedRsvps.length
    ),
    estimatedPax: attendingRsvps.reduce(
      (sum, r) => sum + (Number.isFinite(r.pax) ? r.pax : 0),
      0
    ),
    totalWishes: wishes.length,
  };

  const cloudDbActive = isSupabaseConfigured() || isPostgresConfigured();

  const invitationsSentCount = guests.filter((g) => g.invitation_sent).length;
  const totalMaxPaxQuota = guests.reduce((sum, g) => sum + (g.max_pax || 0), 0);
  const unsureRsvpsCount = rsvps.filter(
    (r) => r.attendance_status === "ragu"
  ).length;

  const responseRatePercent =
    metrics.totalGuests > 0
      ? Math.min(100, Math.round((rsvps.length / metrics.totalGuests) * 100))
      : 0;

  const latestRsvps = rsvps.slice(0, 5);
  const latestWishes = wishes.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Operational Header Ledger (No blurred radial orbs or AI pills) */}
      <div className="rounded-sm border border-[#C5A059]/40 bg-[#1C2B24] p-6 text-[#FAF7F2] sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C5A059]">
              Laporan Operasional Pernikahan •{" "}
              {WEDDING_CONFIG.couple.groom.nickname} &amp;{" "}
              {WEDDING_CONFIG.couple.bride.nickname}
            </p>
            <h1 className="mt-2 font-serif-luxury text-3xl font-semibold text-[#FAF7F2] sm:text-4xl">
              Ringkasan Kehadiran &amp; Distribusi Undangan
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#FAF7F2]/80 sm:text-sm">
              Pantau rekapitulasi tamu terdaftar, alokasi kursi resepsi (pax),
              dan status pengiriman undangan WhatsApp personal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-[#C5A059]/35 bg-[#243830] px-3.5 py-2 text-xs text-[#E5D1A7]">
              <Database className="h-3.5 w-3.5" />
              <span>
                Basis Data:{" "}
                <strong className="text-white">
                  {cloudDbActive ? "PostgreSQL Cloud" : "Local Persistent DB"}
                </strong>
              </span>
            </div>
            <Link
              href="/admin/guests"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-[#C5A059] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1C2B24] transition-colors hover:bg-[#E5D1A7]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Kelola &amp; Kirim WA</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Operational Focus: RSVP Progress & Immediate Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6 lg:col-span-8">
          <div className="flex items-baseline justify-between border-b border-[#F2ECE1] pb-4">
            <div>
              <h2 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                Progres Konfirmasi Kehadiran (RSVP)
              </h2>
              <p className="text-xs text-[#4A6358]">
                 proporsi tamu undangan yang telah menyerahkan konfirmasi
                kehadiran
              </p>
            </div>
            <span className="font-serif-luxury text-3xl font-bold text-[#1C2B24] tabular-nums">
              {responseRatePercent}%
            </span>
          </div>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-sm border border-[#C5A059]/30 bg-[#FAF7F2]">
            <div
              className="h-full bg-[#243830] transition-all duration-500"
              style={{ width: `${responseRatePercent}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-sm border border-emerald-200 bg-emerald-50/70 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Hadir
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-950 tabular-nums">
                {metrics.totalAttendingRsvps} Tamu
              </p>
            </div>
            <div className="rounded-sm border border-rose-200 bg-rose-50/70 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-800">
                Berhalangan
              </p>
              <p className="mt-1 text-xl font-bold text-rose-950 tabular-nums">
                {metrics.totalDeclinedRsvps} Tamu
              </p>
            </div>
            <div className="rounded-sm border border-amber-200 bg-amber-50/70 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                Masih Ragu
              </p>
              <p className="mt-1 text-xl font-bold text-amber-950 tabular-nums">
                {unsureRsvpsCount} Tamu
              </p>
            </div>
            <div className="rounded-sm border border-stone-200 bg-stone-50 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                Belum Merespons
              </p>
              <p className="mt-1 text-xl font-bold text-stone-900 tabular-nums">
                {metrics.totalPendingGuests} Tamu
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Ledger */}
        <div className="flex flex-col justify-between rounded-sm border border-[#C5A059]/40 bg-white p-6 lg:col-span-4">
          <div>
            <h2 className="font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
              Tindakan Cepat
            </h2>
            <p className="mt-1 text-xs text-[#4A6358]">
              Pintasan operasional daftar tamu dan rekapitulasi kursi
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            <Link
              href="/admin/guests"
              className="flex min-h-11 items-center justify-between rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2] p-3.5 transition-colors hover:bg-[#F2ECE1]"
            >
              <div>
                <p className="text-xs font-semibold text-[#1C2B24]">
                  Tambah Tamu &amp; Kirim WhatsApp
                </p>
                <p className="text-[11px] text-[#4A6358]">
                  Buat tautan `?to=` dan kirim undangan
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8A6825]" />
            </Link>

            <Link
              href="/admin/rsvp"
              className="flex min-h-11 items-center justify-between rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2] p-3.5 transition-colors hover:bg-[#F2ECE1]"
            >
              <div>
                <p className="text-xs font-semibold text-[#1C2B24]">
                  Ekspor Laporan Kehadiran (CSV)
                </p>
                <p className="text-[11px] text-[#4A6358]">
                  Unduh tabel kuota kursi untuk panitia
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8A6825]" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1. Total Tamu */}
        <div className="flex flex-col justify-between rounded-sm border border-[#C5A059]/35 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Total Tamu Terdaftar
              </p>
              <p className="mt-2 font-serif-luxury text-4xl font-bold text-[#1C2B24] tabular-nums">
                {metrics.totalGuests}
              </p>
            </div>
            <div className="rounded-sm border border-[#C5A059]/30 bg-[#FAF7F2] p-2.5 text-[#243830]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#F2ECE1] pt-3 text-xs">
            <span className="text-[#4A6358]">WA Terkirim:</span>
            <span className="font-semibold text-[#1C2B24] tabular-nums">
              {invitationsSentCount} / {metrics.totalGuests} Tamu
            </span>
          </div>
        </div>

        {/* 2. Jumlah Hadir */}
        <div className="flex flex-col justify-between rounded-sm border border-[#C5A059]/35 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Konfirmasi Hadir
              </p>
              <p className="mt-2 font-serif-luxury text-4xl font-bold text-emerald-800 tabular-nums">
                {metrics.totalAttendingRsvps}
              </p>
            </div>
            <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#F2ECE1] pt-3 text-xs tabular-nums">
            <span className="font-medium text-rose-800">
              Tidak Hadir: {metrics.totalDeclinedRsvps}
            </span>
            <span className="font-medium text-amber-800">
              Ragu: {unsureRsvpsCount}
            </span>
          </div>
        </div>

        {/* 3. Estimasi Pax */}
        <div className="flex flex-col justify-between rounded-sm border border-[#C5A059]/35 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Estimasi Kursi (Pax)
              </p>
              <p className="mt-2 font-serif-luxury text-4xl font-bold text-[#8A6825] tabular-nums">
                {metrics.estimatedPax}
                <span className="ml-1.5 font-sans text-xs font-normal text-[#4A6358]">
                  kursi
                </span>
              </p>
            </div>
            <div className="rounded-sm border border-[#C5A059]/30 bg-[#FAF7F2] p-2.5 text-[#8A6825]">
              <UsersRound className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#F2ECE1] pt-3 text-xs">
            <span className="text-[#4A6358]">Kuota Maksimal:</span>
            <span className="font-semibold text-[#1C2B24] tabular-nums">
              {totalMaxPaxQuota} Pax
            </span>
          </div>
        </div>

        {/* 4. Total Ucapan */}
        <div className="flex flex-col justify-between rounded-sm border border-[#C5A059]/35 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Total Doa &amp; Ucapan
              </p>
              <p className="mt-2 font-serif-luxury text-4xl font-bold text-[#1C2B24] tabular-nums">
                {metrics.totalWishes}
              </p>
            </div>
            <div className="rounded-sm border border-[#C5A059]/30 bg-[#FAF7F2] p-2.5 text-[#8A6825]">
              <MessageSquareHeart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#F2ECE1] pt-3 text-xs">
            <span className="text-[#4A6358]">Tampil di Buku Tamu</span>
            <Link
              href="/admin/wishes"
              className="inline-flex items-center gap-1 font-semibold text-[#243830] hover:text-[#8A6825]"
            >
              <span>Moderasi</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Activity Ledgers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest 5 RSVPs */}
        <div className="overflow-hidden rounded-sm border border-[#C5A059]/40 bg-white">
          <div className="flex items-center justify-between border-b border-[#F2ECE1] px-6 py-4">
            <div>
              <h2 className="font-serif-luxury text-xl font-semibold text-[#1C2B24]">
                Konfirmasi RSVP Terbaru
              </h2>
              <p className="text-xs text-[#4A6358]">
                5 pembaruan status kehadiran terakhir
              </p>
            </div>
            <Link
              href="/admin/rsvp"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#243830] hover:text-[#8A6825]"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#F2ECE1]">
            {latestRsvps.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#4A6358]">
                Belum ada konfirmasi RSVP yang tercatat.
              </div>
            ) : (
              latestRsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-[#FAF7F2]/60"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#1C2B24]">
                        {rsvp.guest_name}
                      </p>
                      <StatusBadge status={rsvp.attendance_status} />
                    </div>
                    {rsvp.notes && (
                      <p className="mt-1 line-clamp-1 text-xs italic text-[#4A6358]">
                        &ldquo;{rsvp.notes}&rdquo;
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-[#4A6358] tabular-nums">
                      Diperbarui {formatDateId(rsvp.updated_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#1C2B24] tabular-nums">
                      {rsvp.pax} Pax
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest 5 Wishes */}
        <div className="overflow-hidden rounded-sm border border-[#C5A059]/40 bg-white">
          <div className="flex items-center justify-between border-b border-[#F2ECE1] px-6 py-4">
            <div>
              <h2 className="font-serif-luxury text-xl font-semibold text-[#1C2B24]">
                Ucapan &amp; Doa Terbaru
              </h2>
              <p className="text-xs text-[#4A6358]">
                5 catatan terbaru pada lembar doa restu
              </p>
            </div>
            <Link
              href="/admin/wishes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#243830] hover:text-[#8A6825]"
            >
              <span>Moderasi Semua</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#F2ECE1]">
            {latestWishes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#4A6358]">
                Belum ada ucapan doa restu yang dikirimkan.
              </div>
            ) : (
              latestWishes.map((wish) => (
                <div
                  key={wish.id}
                  className="px-6 py-4 transition-colors hover:bg-[#FAF7F2]/60"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#1C2B24]">
                        {wish.sender_name}
                      </p>
                      {wish.attendance_badge && (
                        <StatusBadge status={wish.attendance_badge} />
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-[#4A6358] tabular-nums">
                      {formatDateId(wish.created_at)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[#4A6358]">
                    {wish.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
