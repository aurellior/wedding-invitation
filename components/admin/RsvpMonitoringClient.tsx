"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import type {
  AttendanceStatus,
  Guest,
  GuestCategory,
  RsvpRecord,
} from "@/types/wedding";
import {
  DEFAULT_WEDDING_CONFIG,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";
import { escapeCsvCell } from "@/lib/security/rate-limit";
import { formatDateId } from "@/lib/utils/format";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";

type FilterStatus =
  | "Semua"
  | "Hadir"
  | "Tidak Hadir"
  | "Masih Ragu"
  | "Belum Konfirmasi";

interface CombinedRsvpRow {
  guestId: string;
  guestName: string;
  category: GuestCategory;
  phone: string;
  maxPax: number;
  status: AttendanceStatus | "belum";
  pax: number;
  notes: string;
  updatedAt: string | null;
}

export default function RsvpMonitoringClient({
  guests,
  rsvps,
  weddingConfig = DEFAULT_WEDDING_CONFIG,
}: {
  guests: Guest[];
  rsvps: RsvpRecord[];
  weddingConfig?: WeddingContentConfig;
}) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const combinedRows = useMemo<CombinedRsvpRow[]>(() => {
    const rsvpMap = new Map<string, RsvpRecord>();
    for (const r of rsvps) {
      rsvpMap.set(r.guest_id, r);
    }

    const rows: CombinedRsvpRow[] = guests.map((g) => {
      const rsvp = rsvpMap.get(g.id);
      return {
        guestId: g.id,
        guestName: g.name,
        category: g.category,
        phone: g.phone,
        maxPax: g.max_pax,
        status: rsvp ? rsvp.attendance_status : "belum",
        pax: rsvp ? rsvp.pax : 0,
        notes: rsvp?.notes ?? "",
        updatedAt: rsvp?.updated_at ?? null,
      };
    });

    // Also include any RSVP records whose guest_id wasn't in guests list
    const guestIdSet = new Set(guests.map((g) => g.id));
    for (const r of rsvps) {
      if (!guestIdSet.has(r.guest_id)) {
        rows.unshift({
          guestId: r.guest_id,
          guestName: r.guest_name,
          category: "Umum",
          phone: "",
          maxPax: Math.max(2, r.pax),
          status: r.attendance_status,
          pax: r.pax,
          notes: r.notes ?? "",
          updatedAt: r.updated_at,
        });
      }
    }

    return rows;
  }, [guests, rsvps]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return combinedRows.filter((row) => {
      const matchesStatus =
        statusFilter === "Semua" ||
        (statusFilter === "Hadir" && row.status === "hadir") ||
        (statusFilter === "Tidak Hadir" && row.status === "tidak_hadir") ||
        (statusFilter === "Masih Ragu" && row.status === "ragu") ||
        (statusFilter === "Belum Konfirmasi" && row.status === "belum");

      const matchesSearch =
        !q ||
        row.guestName.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.notes.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [combinedRows, statusFilter, searchQuery]);

  const counters = useMemo(() => {
    const hadirRows = combinedRows.filter((r) => r.status === "hadir");
    const tidakHadirRows = combinedRows.filter(
      (r) => r.status === "tidak_hadir"
    );
    const raguRows = combinedRows.filter((r) => r.status === "ragu");
    const belumRows = combinedRows.filter((r) => r.status === "belum");

    const confirmedPax = hadirRows.reduce((sum, r) => sum + r.pax, 0);
    const raguPax = raguRows.reduce((sum, r) => sum + r.pax, 0);

    return {
      hadirCount: hadirRows.length,
      confirmedPax,
      tidakHadirCount: tidakHadirRows.length,
      raguCount: raguRows.length,
      raguPax,
      belumCount: belumRows.length,
    };
  }, [combinedRows]);

  const handleExportCsv = () => {
    const headers = [
      "Nama Tamu",
      "Kategori",
      "No WhatsApp",
      "Status Kehadiran",
      "Jumlah Pax",
      "Kuota Maksimal",
      "Catatan",
      "Waktu Konfirmasi",
    ];

    const statusLabel = (s: CombinedRsvpRow["status"]) => {
      if (s === "hadir") return "Hadir";
      if (s === "tidak_hadir") return "Tidak Hadir";
      if (s === "ragu") return "Masih Ragu";
      return "Belum Konfirmasi";
    };

    const csvLines = [
      headers.map(escapeCsvCell).join(","),
      ...filteredRows.map((row) =>
        [
          row.guestName,
          row.category,
          row.phone || "-",
          statusLabel(row.status),
          row.pax,
          row.maxPax,
          row.notes || "-",
          row.updatedAt ? formatDateId(row.updatedAt) : "-",
        ]
          .map(escapeCsvCell)
          .join(",")
      ),
    ];

    const csvString = "\uFEFF" + csvLines.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const groomSlug = weddingConfig.couple.groom.nickname
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const brideSlug = weddingConfig.couple.bride.nickname
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-rsvp-${groomSlug}-${brideSlug}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5D1A7]/60 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C5A059] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Attendance &amp; Pax Tracker
          </div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-semibold text-[#243830]">
            Monitoring Konfirmasi RSVP
          </h1>
          <p className="text-xs text-[#4A6358] mt-1">
            Pantau daftar kehadiran tamu, jumlah kursi (pax), serta ekspor
            laporan untuk Wedding Organizer.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#243830] hover:bg-[#1a2923] text-[#FAF7F2] text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-[#C5A059]" />
          Export CSV ({filteredRows.length} Baris)
        </button>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Konfirmasi Hadir
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            {counters.hadirCount} Tamu
          </p>
          <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <UsersRound className="w-3.5 h-3.5" />
            Total Estimasi: {counters.confirmedPax} Pax
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Tidak Hadir
            </span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-900 mt-2">
            {counters.tidakHadirCount} Tamu
          </p>
          <p className="text-xs text-rose-700 mt-1">
            Telah mengonfirmasi berhalangan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Masih Ragu
            </span>
            <HelpCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            {counters.raguCount} Tamu
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Potensi tambahan: {counters.raguPax} Pax
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-600">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Belum Konfirmasi
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-stone-800 mt-2">
            {counters.belumCount} Tamu
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Menunggu respon undangan
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5D1A7]/60 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              "Semua",
              "Hadir",
              "Tidak Hadir",
              "Masih Ragu",
              "Belum Konfirmasi",
            ] as FilterStatus[]
          ).map((tab) => {
            const active = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#243830] text-[#FAF7F2] shadow-xs"
                    : "bg-[#FAF7F2] text-[#4A6358] hover:bg-[#F2ECE1] hover:text-[#243830]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#4A6358] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama tamu, kategori, atau catatan..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E5D1A7] bg-[#FAF7F2]/60 text-xs text-[#222624] placeholder:text-[#4A6358]/60 focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Reset pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#4A6358] hover:text-[#243830] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* RSVP Table */}
      <div className="bg-white rounded-2xl border border-[#E5D1A7]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E5D1A7]/60 text-[11px] font-semibold uppercase tracking-wider text-[#4A6358] whitespace-nowrap">
                <th className="py-3.5 px-5">Nama Tamu</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Status Kehadiran</th>
                <th className="py-3.5 px-4 text-center">Jumlah Pax</th>
                <th className="py-3.5 px-5">Catatan Tamu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF7F2] text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 px-6 text-center text-[#4A6358]"
                  >
                    Tidak ada data RSVP yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.guestId}
                    className="hover:bg-[#FAF7F2]/60 transition-colors"
                  >
                    <td className="py-4 px-5 align-middle">
                      <div className="max-w-[180px] sm:max-w-[220px] md:max-w-[260px] overflow-hidden">
                        <p
                          className="font-semibold text-[#243830] text-sm truncate"
                          title={row.guestName}
                        >
                          {row.guestName}
                        </p>
                        {row.phone && (
                          <p className="text-[11px] text-[#4A6358] font-mono mt-0.5 truncate">
                            {row.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF7F2] text-[#243830] border border-[#E5D1A7]">
                        {row.category}
                      </span>
                    </td>

                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                      <AttendanceStatusBadge
                        status={row.status}
                        pendingLabel="Belum Konfirmasi"
                      />
                    </td>

                    <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E5D1A7]/60 font-semibold text-[#243830]">
                        {row.pax} / {row.maxPax} Pax
                      </span>
                    </td>

                    <td className="py-4 px-5 align-middle">
                      {row.notes ? (
                        <p
                          className="text-xs text-[#222624] italic line-clamp-2 break-words"
                          title={row.notes}
                        >
                          &ldquo;{row.notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-[#4A6358]/50">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
