"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  MessageSquareHeart,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
} from "lucide-react";
import type { AttendanceStatus, WishRecord } from "@/types/wedding";

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

function AttendanceBadge({ status }: { status?: AttendanceStatus | null }) {
  if (status === "hadir") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Hadir
      </span>
    );
  }
  if (status === "tidak_hadir") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
        <XCircle className="h-3 w-3" />
        Tidak Hadir
      </span>
    );
  }
  if (status === "ragu") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <HelpCircle className="h-3 w-3" />
        Masih Ragu
      </span>
    );
  }
  return null;
}

export default function WishesModerationClient({
  initialWishes,
}: {
  initialWishes: WishRecord[];
}) {
  const router = useRouter();
  const [wishes, setWishes] = useState<WishRecord[]>(initialWishes);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredWishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return wishes;
    return wishes.filter(
      (w) =>
        w.sender_name.toLowerCase().includes(q) ||
        w.message.toLowerCase().includes(q)
    );
  }, [wishes, searchQuery]);

  const handleDeleteWish = async (wish: WishRecord) => {
    const confirmed = window.confirm(
      `Hapus ucapan dari "${wish.sender_name}" dari halaman buku tamu?`
    );
    if (!confirmed) return;

    setDeletingId(wish.id);
    try {
      const res = await fetch(
        `/api/wishes?id=${encodeURIComponent(wish.id)}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setWishes((prev) => prev.filter((item) => item.id !== wish.id));
        router.refresh();
      }
    } catch {
      // Ignore network error
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
            Moderasi Buku Tamu &amp; Doa
          </p>
          <h1 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24] sm:text-3xl">
            Moderasi Ucapan &amp; Doa Restu
          </h1>
          <p className="mt-1 text-xs text-[#4A6358] tabular-nums">
            Total <strong>{wishes.length} ucapan</strong> tampil pada halaman
            undangan publik.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A6358]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari pengirim atau isi ucapan"
            placeholder="Cari pengirim atau isi ucapan..."
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

      {/* Wishes Ledger Grid */}
      {filteredWishes.length === 0 ? (
        <div className="rounded-sm border border-[#C5A059]/40 bg-white p-12 text-center">
          <MessageSquareHeart className="mx-auto mb-3 h-9 w-9 text-[#8A6825] opacity-70" />
          <h2 className="font-serif-luxury text-xl font-semibold text-[#1C2B24]">
            Belum ada ucapan yang ditemukan
          </h2>
          <p className="mt-1 text-xs text-[#4A6358]">
            Semua ucapan doa restu dari tamu undangan akan tercatat di halaman
            ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredWishes.map((wish) => (
            <article
              key={wish.id}
              className="flex flex-col justify-between gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-5 transition-colors hover:border-[#243830]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#1C2B24]">
                        {wish.sender_name}
                      </h2>
                      <AttendanceBadge status={wish.attendance_badge} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#4A6358] tabular-nums">
                      Dikirim pada {formatDateId(wish.created_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={deletingId === wish.id}
                    onClick={() => handleDeleteWish(wish)}
                    title="Hapus ucapan ini"
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>
                      {deletingId === wish.id ? "Menghapus..." : "Hapus"}
                    </span>
                  </button>
                </div>

                <div className="mt-3.5 rounded-sm border border-[#C5A059]/25 bg-[#FAF7F2] p-3.5 text-xs leading-relaxed text-[#222624]">
                  &ldquo;{wish.message}&rdquo;
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
