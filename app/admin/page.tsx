import React from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UsersRound,
  MessageSquareHeart,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getGuests,
  getRsvps,
  getWeddingConfig,
  getWishes,
} from "@/lib/supabase/repository";
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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Hadir
      </span>
    );
  }
  if (status === "tidak_hadir") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <XCircle className="w-3 h-3" />
        Tidak Hadir
      </span>
    );
  }
  if (status === "ragu") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        <HelpCircle className="w-3 h-3" />
        Masih Ragu
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
      <Clock className="w-3 h-3" />
      Menunggu
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [guests, rsvps, wishes, config] = await Promise.all([
    getGuests(),
    getRsvps(),
    getWishes(),
    getWeddingConfig(),
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

  const invitationsSentCount = guests.filter((g) => g.invitation_sent).length;
  const totalMaxPaxQuota = guests.reduce((sum, g) => sum + (g.max_pax || 0), 0);
  const unsureRsvpsCount = rsvps.filter(
    (r) => r.attendance_status === "ragu"
  ).length;

  const responseRatePercent =
    metrics.totalGuests > 0
      ? Math.min(
          100,
          Math.round((rsvps.length / metrics.totalGuests) * 100)
        )
      : 0;

  const latestRsvps = rsvps.slice(0, 5);
  const latestWishes = wishes.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#243830] text-[#FAF7F2] p-6 sm:p-8 shadow-lg border border-[#C5A059]/30">
        <div className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#C5A059]/15 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#E5D1A7] text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Overview Pernikahan {config.couple.groom.nickname} &amp;{" "}
              {config.couple.bride.nickname}
            </span>
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-semibold text-white">
            Ringkasan Back-Office &amp; Kehadiran Tamu
          </h1>
          <p className="text-xs sm:text-sm text-[#FAF7F2]/80 mt-1.5 max-w-2xl">
            Pantau statistik undangan, kuota kursi (pax), status konfirmasi
            RSVP, dan pengiriman pesan WhatsApp personal secara real-time.
          </p>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* 1. Total Tamu */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Total Tamu
              </p>
              <p className="text-3xl font-bold text-[#243830] mt-2">
                {metrics.totalGuests}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#243830]/8 text-[#243830]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-[#FAF7F2] flex items-center justify-between text-xs">
            <span className="text-[#4A6358]">Undangan Terkirim:</span>
            <span className="font-semibold text-[#243830]">
              {invitationsSentCount} / {metrics.totalGuests} Tamu
            </span>
          </div>
        </div>

        {/* 2. Jumlah Hadir */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Jumlah Hadir
              </p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">
                {metrics.totalAttendingRsvps}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-[#FAF7F2] flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">
              Tidak Hadir: {metrics.totalDeclinedRsvps}
            </span>
            <span className="text-amber-700 font-medium">
              Ragu: {unsureRsvpsCount} • Belum: {metrics.totalPendingGuests}
            </span>
          </div>
        </div>

        {/* 3. Estimasi Pax */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Estimasi Pax
              </p>
              <p className="text-3xl font-bold text-[#C5A059] mt-2">
                {metrics.estimatedPax}
                <span className="text-sm font-normal text-[#4A6358] ml-1.5">
                   kursi
                </span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#C5A059]/15 text-[#243830]">
              <UsersRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-[#FAF7F2] flex items-center justify-between text-xs">
            <span className="text-[#4A6358]">Total Kuota Maksimal:</span>
            <span className="font-semibold text-[#243830]">
              {totalMaxPaxQuota} Pax
            </span>
          </div>
        </div>

        {/* 4. Total Ucapan */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A6358]">
                Total Ucapan
              </p>
              <p className="text-3xl font-bold text-[#243830] mt-2">
                {metrics.totalWishes}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#243830]/8 text-[#C5A059]">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-[#FAF7F2] flex items-center justify-between text-xs">
            <span className="text-[#4A6358]">Ditampilkan di WishWall</span>
            <Link
              href="/admin/wishes"
              className="font-semibold text-[#243830] hover:text-[#C5A059] inline-flex items-center gap-1"
            >
              Moderasi
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Progress & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-serif-luxury text-xl font-semibold text-[#243830]">
                Progres Konfirmasi Kehadiran (RSVP)
              </h2>
              <p className="text-xs text-[#4A6358]">
                Persentase tamu undangan yang telah mengisi formulir RSVP
              </p>
            </div>
            <span className="text-lg font-bold text-[#243830]">
              {responseRatePercent}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#FAF7F2] overflow-hidden border border-[#E5D1A7]/50">
            <div
              className="h-full bg-gradient-to-r from-[#243830] to-[#C5A059] rounded-full transition-all duration-500"
              style={{ width: `${responseRatePercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
              <p className="text-[11px] text-emerald-800 font-medium">
                Konfirmasi Hadir
              </p>
              <p className="text-lg font-bold text-emerald-900 mt-0.5">
                {metrics.totalAttendingRsvps} Tamu
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/60">
              <p className="text-[11px] text-rose-800 font-medium">
                Berhalangan Hadir
              </p>
              <p className="text-lg font-bold text-rose-900 mt-0.5">
                {metrics.totalDeclinedRsvps} Tamu
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <p className="text-[11px] text-amber-800 font-medium">
                Masih Ragu
              </p>
              <p className="text-lg font-bold text-amber-900 mt-0.5">
                {unsureRsvpsCount} Tamu
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
              <p className="text-[11px] text-stone-600 font-medium">
                Belum Konfirmasi
              </p>
              <p className="text-lg font-bold text-stone-800 mt-0.5">
                {metrics.totalPendingGuests} Tamu
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5D1A7]/60 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-serif-luxury text-xl font-semibold text-[#243830]">
              Aksi Cepat Organizer
            </h2>
            <p className="text-xs text-[#4A6358] mt-1">
              Pintasan menuju fitur utama pengelolaan tamu &amp; laporan
            </p>
          </div>

          <div className="space-y-2.5 mt-4">
            <Link
              href="/admin/content"
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E5D1A7]/60 transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-[#243830]">
                  Ubah Konten Undangan (Mempelai &amp; Acara)
                </p>
                <p className="text-[11px] text-[#4A6358]">
                  Edit nama mempelai, alamat gedung, maps &amp; rekening
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
            </Link>

            <Link
              href="/admin/guests"
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E5D1A7]/60 transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-[#243830]">
                  Tambah Tamu &amp; Kirim WhatsApp
                </p>
                <p className="text-[11px] text-[#4A6358]">
                  Buat link unik `?to=` &amp; kirim pesan otomatis
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
            </Link>

            <Link
              href="/admin/rsvp"
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E5D1A7]/60 transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-[#243830]">
                  Ekspor Laporan Kehadiran (CSV)
                </p>
                <p className="text-[11px] text-[#4A6358]">
                  Unduh rekapitulasi kursi &amp; catatan tamu
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Activity: Latest 5 RSVPs & Latest 5 Wishes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest 5 RSVPs */}
        <div className="bg-white rounded-2xl border border-[#E5D1A7]/60 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#FAF7F2] flex items-center justify-between">
            <div>
              <h2 className="font-serif-luxury text-xl font-semibold text-[#243830]">
                Konfirmasi RSVP Terbaru
              </h2>
              <p className="text-xs text-[#4A6358]">
                5 pembaruan status kehadiran terakhir
              </p>
            </div>
            <Link
              href="/admin/rsvp"
              className="text-xs font-semibold text-[#243830] hover:text-[#C5A059] inline-flex items-center gap-1"
            >
              Lihat Semua
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#FAF7F2]">
            {latestRsvps.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#4A6358]">
                Belum ada data konfirmasi RSVP yang masuk.
              </div>
            ) : (
              latestRsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-[#FAF7F2]/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="text-sm font-semibold text-[#243830] truncate max-w-[220px] sm:max-w-xs"
                        title={rsvp.guest_name}
                      >
                        {rsvp.guest_name}
                      </p>
                      <StatusBadge status={rsvp.attendance_status} />
                    </div>
                    {rsvp.notes && (
                      <p
                        className="text-xs text-[#4A6358] mt-1 line-clamp-1 italic break-words"
                        title={rsvp.notes}
                      >
                        &ldquo;{rsvp.notes}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-[#4A6358]/70 mt-1">
                      Diperbarui {formatDateId(rsvp.updated_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E5D1A7]/60 text-xs font-semibold text-[#243830]">
                      {rsvp.pax} Pax
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest 5 Wishes */}
        <div className="bg-white rounded-2xl border border-[#E5D1A7]/60 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#FAF7F2] flex items-center justify-between">
            <div>
              <h2 className="font-serif-luxury text-xl font-semibold text-[#243830]">
                Ucapan &amp; Doa Terbaru
              </h2>
              <p className="text-xs text-[#4A6358]">
                5 pesan terbaru pada dinding ucapan (WishWall)
              </p>
            </div>
            <Link
              href="/admin/wishes"
              className="text-xs font-semibold text-[#243830] hover:text-[#C5A059] inline-flex items-center gap-1"
            >
              Moderasi Semua
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#FAF7F2]">
            {latestWishes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#4A6358]">
                Belum ada ucapan doa restu yang dikirimkan.
              </div>
            ) : (
              latestWishes.map((wish) => (
                <div
                  key={wish.id}
                  className="px-6 py-4 hover:bg-[#FAF7F2]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold text-[#243830] truncate max-w-[220px] sm:max-w-xs"
                        title={wish.sender_name}
                      >
                        {wish.sender_name}
                      </p>
                      {wish.attendance_badge && (
                        <StatusBadge status={wish.attendance_badge} />
                      )}
                    </div>
                    <span className="text-[11px] text-[#4A6358]/70 shrink-0 whitespace-nowrap">
                      {formatDateId(wish.created_at)}
                    </span>
                  </div>
                  <p
                    className="text-xs text-[#4A6358] line-clamp-2 leading-relaxed break-words"
                    title={wish.message}
                  >
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
