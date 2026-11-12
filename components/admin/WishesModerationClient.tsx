"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  MessageSquareHeart,
  Sparkles,
  X,
} from "lucide-react";
import type { WishRecord } from "@/types/wedding";
import { formatDateId, truncateText } from "@/lib/utils/format";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { ConfirmModal } from "./ConfirmModal";

export default function WishesModerationClient({
  initialWishes,
}: {
  initialWishes: WishRecord[];
}) {
  const router = useRouter();
  const [wishes, setWishes] = useState<WishRecord[]>(initialWishes);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishToDelete, setWishToDelete] = useState<WishRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredWishes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return wishes;
    return wishes.filter(
      (w) =>
        w.sender_name.toLowerCase().includes(q) ||
        w.message.toLowerCase().includes(q)
    );
  }, [wishes, searchQuery]);

  const handleConfirmDeleteWish = async () => {
    if (!wishToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/wishes?id=${encodeURIComponent(wishToDelete.id)}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setWishes((prev) => prev.filter((item) => item.id !== wishToDelete.id));
        router.refresh();
        setWishToDelete(null);
      }
    } catch {
      // Ignore network error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5D1A7]/60 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C5A059] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            WishWall Moderation
          </div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-semibold text-[#243830]">
            Moderasi Ucapan &amp; Doa Restu
          </h1>
          <p className="text-xs text-[#4A6358] mt-1">
            Total <strong>{wishes.length} ucapan</strong> tampil pada halaman
            undangan publik. Anda dapat menghapus pesan spam atau tidak pantas.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#4A6358] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengirim atau isi ucapan..."
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

      {/* Wishes Grid */}
      {filteredWishes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5D1A7]/60 p-12 text-center shadow-xs">
          <MessageSquareHeart className="w-10 h-10 text-[#C5A059] mx-auto mb-3 opacity-70" />
          <p className="font-serif-luxury text-xl font-semibold text-[#243830]">
            Belum ada ucapan yang ditemukan
          </p>
          <p className="text-xs text-[#4A6358] mt-1">
            Semua ucapan doa restu dari tamu undangan akan muncul di halaman ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWishes.map((wish) => (
            <div
              key={wish.id}
              className="bg-white rounded-2xl border border-[#E5D1A7]/60 p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-[#C5A059] transition-colors overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="font-semibold text-[#243830] text-sm truncate max-w-[180px] sm:max-w-[240px]"
                        title={wish.sender_name}
                      >
                        {truncateText(wish.sender_name, 20)}
                      </h3>
                      {wish.attendance_badge && (
                        <AttendanceStatusBadge status={wish.attendance_badge} />
                      )}
                    </div>
                    <p className="text-[11px] text-[#4A6358]/75 mt-0.5">
                      Dikirim pada {formatDateId(wish.created_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWishToDelete(wish)}
                    title="Hapus ucapan ini"
                    className="inline-flex h-8 items-center gap-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="mt-3.5 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5D1A7]/40 text-xs text-[#222624] leading-relaxed break-words whitespace-pre-line">
                  &ldquo;{wish.message}&rdquo;
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!wishToDelete}
        onClose={() => {
          if (!isDeleting) setWishToDelete(null);
        }}
        onConfirm={handleConfirmDeleteWish}
        title="Hapus Ucapan"
        description={
          <span>
            Apakah Anda yakin ingin menghapus ucapan dari{" "}
            <strong
              className="text-[#243830]"
              title={wishToDelete?.sender_name}
            >
              {truncateText(wishToDelete?.sender_name, 20)}
            </strong>
            ? Ucapan yang dihapus akan hilang dari WishWall dan tidak dapat
            dikembalikan.
          </span>
        }
        confirmText="Ya, Hapus Ucapan"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
