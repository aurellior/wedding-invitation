"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  UsersRound,
  X,
} from "lucide-react";
import type {
  AttendanceStatus,
  Guest,
  GuestCategory,
  RsvpRecord,
} from "@/types/wedding";

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

function formatDateId(iso: string | null): string {
  if (!iso) return "-";
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

export default function RsvpMonitoringClient({
  guests,
  rsvps,
}: {
  guests: Guest[];
  rsvps: RsvpRecord[];
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

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      headers.map(escapeCsv).join(","),
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
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const csvString = "\uFEFF" + csvLines.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-rsvp-arka-nadia-${new Date()
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
      <div className="flex flex-col gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
            Rekapitulasi Kehadiran &amp; Alokasi Kursi
          </p>
          <h1 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24] sm:text-3xl">
            Monitoring Konfirmasi RSVP
          </h1>
          <p className="mt-1 text-xs text-[#4A6358]">
            Pantau daftar kehadiran tamu, jumlah kursi (pax), serta ekspor
            laporan untuk panitia resepsi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-[#243830] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24] tabular-nums"
        >
          <Download className="h-4 w-4 text-[#E5D1A7]" />
          <span>Ekspor CSV ({filteredRows.length} Baris)</span>
        </button>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-sm border border-emerald-200 bg-white p-5">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Konfirmasi Hadir
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 font-serif-luxury text-3xl font-bold text-emerald-950 tabular-nums">
            {counters.hadirCount} Tamu
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-800 tabular-nums">
            <UsersRound className="h-3.5 w-3.5" />
            <span>Total Estimasi: {counters.confirmedPax} Pax</span>
          </p>
        </div>

        <div className="rounded-sm border border-rose-200 bg-white p-5">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Tidak Hadir
            </span>
            <XCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 font-serif-luxury text-3xl font-bold text-rose-950 tabular-nums">
            {counters.tidakHadirCount} Tamu
          </p>
          <p className="mt-1 text-xs text-rose-800">
            Telah mengonfirmasi berhalangan
          </p>
        </div>

        <div className="rounded-sm border border-amber-200 bg-white p-5">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Masih Ragu
            </span>
            <HelpCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 font-serif-luxury text-3xl font-bold text-amber-950 tabular-nums">
            {counters.raguCount} Tamu
          </p>
          <p className="mt-1 text-xs text-amber-800 tabular-nums">
            Potensi tambahan: {counters.raguPax} Pax
          </p>
        </div>

        <div className="rounded-sm border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between text-stone-600">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Belum Konfirmasi
            </span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 font-serif-luxury text-3xl font-bold text-stone-900 tabular-nums">
            {counters.belumCount} Tamu
          </p>
          <p className="mt-1 text-xs text-stone-600">
            Menunggu respons undangan
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-4 sm:p-5 lg:flex-row lg:items-center">
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
                className={`min-h-10 whitespace-nowrap rounded-sm px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#243830] text-[#FAF7F2]"
                    : "border border-[#C5A059]/30 bg-[#FAF7F2] text-[#4A6358] hover:bg-[#F2ECE1] hover:text-[#1C2B24]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A6358]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari nama tamu, kategori, atau catatan"
            placeholder="Cari nama tamu, kategori, atau catatan..."
            className="min-h-10 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] py-2 pl-10 pr-9 text-xs text-[#222624] placeholder:text-[#4A6358]/65"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Reset pencarian"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#4A6358] hover:text-[#1C2B24]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* RSVP Table */}
      <div className="overflow-hidden rounded-sm border border-[#C5A059]/40 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#C5A059]/30 bg-[#FAF7F2] text-[11px] font-semibold uppercase tracking-wider text-[#4A6358]">
                <th className="px-5 py-3.5">Nama Tamu</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">Status Kehadiran</th>
                <th className="px-4 py-3.5 text-center">Jumlah Pax</th>
                <th className="px-4 py-3.5">Catatan Tamu</th>
                <th className="px-5 py-3.5 text-right">Waktu Konfirmasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE1] text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-[#4A6358]"
                  >
                    Tidak ada data RSVP yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.guestId}
                    className="transition-colors hover:bg-[#FAF7F2]/60"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#1C2B24]">
                        {row.guestName}
                      </p>
                      {row.phone && (
                        <p className="mt-0.5 font-mono text-[11px] text-[#4A6358] tabular-nums">
                          {row.phone}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2] px-2 py-0.5 text-[11px] font-semibold text-[#1C2B24]">
                        {row.category}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {row.status === "hadir" && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Hadir
                        </span>
                      )}
                      {row.status === "tidak_hadir" && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                          <XCircle className="h-3 w-3" />
                          Tidak Hadir
                        </span>
                      )}
                      {row.status === "ragu" && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          <HelpCircle className="h-3 w-3" />
                          Masih Ragu
                        </span>
                      )}
                      {row.status === "belum" && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                          <Clock className="h-3 w-3" />
                          Belum Konfirmasi
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2] px-2.5 py-1 font-semibold text-[#1C2B24] tabular-nums">
                        {row.pax} / {row.maxPax} Pax
                      </span>
                    </td>

                    <td className="max-w-xs px-4 py-4">
                      {row.notes ? (
                        <p className="text-xs italic text-[#222624]">
                          &ldquo;{row.notes}&rdquo;
                        </p>
                      ) : (
                        <span className="text-[#4A6358]/50">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-[#4A6358] tabular-nums">
                      {formatDateId(row.updatedAt)}
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
