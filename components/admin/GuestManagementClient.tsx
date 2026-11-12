"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Send,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Phone,
  Users,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type {
  Guest,
  GuestCategory,
  RsvpRecord,
} from "@/types/wedding";
import {
  DEFAULT_WEDDING_CONFIG,
  renderWhatsAppTemplate,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";
import {
  normalizeIndonesianPhone,
  truncateText,
} from "@/lib/utils/format";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { ConfirmModal } from "./ConfirmModal";

const CATEGORIES: GuestCategory[] = [
  "Keluarga",
  "Sahabat",
  "Rekan Kerja",
  "Umum",
];

export { normalizeIndonesianPhone };

export function buildPersonalizedUrl(origin: string, guestName: string): string {
  const baseUrl =
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  return `${baseUrl.replace(/\/+$/, "")}/?to=${encodeURIComponent(guestName.trim())}`;
}

export function buildWhatsAppMessage(
  guestName: string,
  invitationUrl: string,
  config: WeddingContentConfig = DEFAULT_WEDDING_CONFIG
): string {
  return renderWhatsAppTemplate(guestName, invitationUrl, config);
}

function CategoryBadge({ category }: { category: GuestCategory }) {
  const styles: Record<GuestCategory, string> = {
    Keluarga: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Sahabat: "bg-sky-50 text-sky-800 border-sky-200",
    "Rekan Kerja": "bg-purple-50 text-purple-800 border-purple-200",
    Umum: "bg-stone-100 text-stone-700 border-stone-200",
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[category] ?? styles.Umum}`}
    >
      {category}
    </span>
  );
}

interface GuestManagementClientProps {
  initialGuests: Guest[];
  initialRsvps: RsvpRecord[];
  weddingConfig?: WeddingContentConfig;
}

export default function GuestManagementClient({
  initialGuests,
  initialRsvps,
  weddingConfig = DEFAULT_WEDDING_CONFIG,
}: GuestManagementClientProps) {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);

  // Modal state for Add / Edit Guest
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<GuestCategory>("Sahabat");
  const [formPhone, setFormPhone] = useState("");
  const [formMaxPax, setFormMaxPax] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal state for Delete confirmation
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [isDeletingGuest, setIsDeletingGuest] = useState(false);

  // Map guest_id -> RsvpRecord for O(1) lookup
  const rsvpByGuestId = useMemo(() => {
    const map = new Map<string, RsvpRecord>();
    for (const rsvp of initialRsvps) {
      map.set(rsvp.guest_id, rsvp);
    }
    return map;
  }, [initialRsvps]);

  const filteredGuests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return guests.filter((g) => {
      const matchesCategory =
        selectedCategory === "Semua" || g.category === selectedCategory;
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [guests, searchQuery, selectedCategory]);

  const openAddModal = () => {
    setEditingGuest(null);
    setFormName("");
    setFormCategory("Sahabat");
    setFormPhone("");
    setFormMaxPax(2);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setFormName(guest.name);
    setFormCategory(guest.category);
    setFormPhone(guest.phone);
    setFormMaxPax(guest.max_pax);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || formName.trim().length < 2) {
      setFormError("Nama tamu minimal 2 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedPhone = normalizeIndonesianPhone(formPhone);

      if (editingGuest) {
        const res = await fetch("/api/guests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingGuest.id,
            name: formName.trim(),
            category: formCategory,
            phone: normalizedPhone,
            max_pax: Number(formMaxPax),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setFormError(json.error || "Gagal memperbarui tamu.");
          return;
        }
        const updated: Guest = json.data;
        setGuests((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } else {
        const res = await fetch("/api/guests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory,
            phone: normalizedPhone,
            max_pax: Number(formMaxPax),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setFormError(json.error || "Gagal menambahkan tamu baru.");
          return;
        }
        const created: Guest = json.data;
        setGuests((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
      router.refresh();
    } catch {
      setFormError("Terjadi gangguan koneksi saat menyimpan data tamu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteGuest = async () => {
    if (!guestToDelete) return;

    setIsDeletingGuest(true);
    try {
      const res = await fetch(
        `/api/guests?id=${encodeURIComponent(guestToDelete.id)}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setGuests((prev) => prev.filter((item) => item.id !== guestToDelete.id));
        router.refresh();
        setGuestToDelete(null);
      }
    } catch {
      // Ignore network error
    } finally {
      setIsDeletingGuest(false);
    }
  };

  const handleCopyInviteLink = async (guest: Guest) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const url = buildPersonalizedUrl(origin, guest.name);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedGuestId(guest.id);
      setTimeout(() => {
        setCopiedGuestId((prev) => (prev === guest.id ? null : prev));
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const handleSendWhatsApp = async (guest: Guest) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const personalizedUrl = buildPersonalizedUrl(origin, guest.name);
    const message = buildWhatsAppMessage(
      guest.name,
      personalizedUrl,
      weddingConfig
    );
    const normalizedPhone = normalizeIndonesianPhone(guest.phone);

    const waUrl = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");

    // Automatically mark invitation_sent: true
    if (!guest.invitation_sent) {
      setGuests((prev) =>
        prev.map((item) =>
          item.id === guest.id ? { ...item, invitation_sent: true } : item
        )
      );

      try {
        await fetch("/api/guests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: guest.id,
            invitation_sent: true,
          }),
        });
        router.refresh();
      } catch {
        // Optimistic update remains
      }
    }
  };

  const handleToggleSentStatus = async (guest: Guest) => {
    const nextSent = !guest.invitation_sent;
    setGuests((prev) =>
      prev.map((item) =>
        item.id === guest.id ? { ...item, invitation_sent: nextSent } : item
      )
    );

    try {
      await fetch("/api/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: guest.id,
          invitation_sent: nextSent,
        }),
      });
      router.refresh();
    } catch {
      // Ignore error
    }
  };

  const sentCount = guests.filter((g) => g.invitation_sent).length;
  const totalQuotaPax = guests.reduce((sum, g) => sum + (g.max_pax || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5D1A7]/60 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C5A059] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Guest List &amp; WhatsApp Dispatcher
          </div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-semibold text-[#243830]">
            Manajemen Tamu Undangan
          </h1>
          <p className="text-xs text-[#4A6358] mt-1">
            Total <strong>{guests.length} tamu</strong> terdaftar ({totalQuotaPax}{" "}
            kuota kursi) • <strong>{sentCount}</strong> undangan telah dikirim
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/content?tab=whatsapp"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#C5A059]/50 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#243830] text-xs font-semibold transition-all"
          >
            <Pencil className="w-3.5 h-3.5 text-[#C5A059]" />
            Edit Template Pesan WA
          </Link>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#243830] hover:bg-[#1a2923] text-[#FAF7F2] text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#C5A059]" />
            Tambah Tamu Undangan
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5D1A7]/60 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {["Semua", ...CATEGORIES].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${active
                  ? "bg-[#243830] text-[#FAF7F2] shadow-xs"
                  : "bg-[#FAF7F2] text-[#4A6358] hover:bg-[#F2ECE1] hover:text-[#243830]"
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#4A6358] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama tamu atau nomor WhatsApp..."
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

      {/* Guests Table */}
      <div className="bg-white rounded-2xl border border-[#E5D1A7]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E5D1A7]/60 text-[11px] font-semibold uppercase tracking-wider text-[#4A6358] whitespace-nowrap">
                <th className="py-3.5 px-5">Nama Tamu</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">No. WhatsApp</th>
                <th className="py-3.5 px-4 text-center">Max Pax</th>
                <th className="py-3.5 px-4">Status RSVP</th>
                <th className="py-3.5 px-4">Status Undangan</th>
                <th className="py-3.5 px-5 text-right">Kolom Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF7F2] text-xs">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 px-6 text-center text-[#4A6358]"
                  >
                    <Users className="w-8 h-8 text-[#C5A059] mx-auto mb-2 opacity-70" />
                    <p className="font-semibold text-[#243830] text-sm">
                      Tidak ada data tamu yang ditemukan
                    </p>
                    <p className="text-xs text-[#4A6358] mt-1">
                      Coba ubah kata kunci pencarian atau tambahkan tamu baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const rsvp = rsvpByGuestId.get(guest.id);
                  const isCopied = copiedGuestId === guest.id;
                  const previewHref = `/?to=${encodeURIComponent(guest.name)}`;

                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-[#FAF7F2]/60 transition-colors"
                    >
                      {/* Nama Tamu */}
                      <td className="py-4 px-5 align-middle">
                        <div className="max-w-[160px] sm:max-w-[200px] md:max-w-[240px] overflow-hidden">
                          <p
                            className="font-semibold text-[#243830] text-sm truncate"
                            title={guest.name}
                          >
                            {truncateText(guest.name, 20)}
                          </p>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <CategoryBadge category={guest.category} />
                      </td>

                      {/* No. WhatsApp */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        {guest.phone ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#222624]">
                            <Phone className="w-3 h-3 text-[#4A6358] shrink-0" />
                            {guest.phone}
                          </span>
                        ) : (
                          <span className="text-[#4A6358]/50 italic">
                            Belum diisi
                          </span>
                        )}
                      </td>

                      {/* Max Pax */}
                      <td className="py-4 px-4 text-center align-middle whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E5D1A7]/60 font-semibold text-[#243830]">
                          {guest.max_pax} Orang
                        </span>
                      </td>

                      {/* Status RSVP */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <AttendanceStatusBadge
                          status={rsvp?.attendance_status}
                          pax={rsvp?.pax}
                          pendingLabel="Belum RSVP"
                          showPax
                        />
                      </td>

                      {/* Status Undangan */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleSentStatus(guest)}
                          title="Klik untuk mengubah status pengiriman"
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${guest.invitation_sent
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            }`}
                        >
                          {guest.invitation_sent ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Sudah Dikirim
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 shrink-0" />
                              Belum Dikirim
                            </>
                          )}
                        </button>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-4 px-5 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* Kirim WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(guest)}
                            className="inline-flex h-8 items-center gap-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            title="Kirim pesan undangan personal via WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>Kirim WhatsApp</span>
                          </button>

                          {/* Salin Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(guest)}
                            className="inline-flex h-8 items-center gap-1 px-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#243830] border border-[#E5D1A7] text-xs font-medium transition-colors cursor-pointer"
                            title="Salin link personal ?to="
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />

                              </>
                            )}
                          </button>

                          {/* Buka Preview Link */}
                          <a
                            href={previewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#243830] border border-[#E5D1A7] transition-colors"
                            title="Buka pratinjau undangan tamu di tab baru"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Edit Tamu */}
                          <button
                            type="button"
                            onClick={() => openEditModal(guest)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#243830] border border-[#E5D1A7] transition-colors cursor-pointer"
                            title="Edit data tamu"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus Tamu */}
                          <button
                            type="button"
                            onClick={() => setGuestToDelete(guest)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Hapus tamu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Tamu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E5D1A7] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-[#243830] text-[#FAF7F2] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-serif-luxury text-2xl font-semibold">
                  {editingGuest ? "Edit Data Tamu" : "Tambah Tamu Undangan"}
                </h2>
                <p className="text-xs text-[#E5D1A7]/80 mt-0.5">
                  Tentukan nama, kategori grup, nomor WhatsApp, dan kuota pax
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-[#FAF7F2]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Lengkap Tamu / Keluarga *
                  </label>
                  <span className="text-[11px] text-[#4A6358]">
                    {formName.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dr. Andi Wijaya & Partner"
                  className="h-11 w-full px-3.5 rounded-xl border border-[#E5D1A7] bg-[#FAF7F2]/60 text-sm text-[#222624] focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white"
                />
                {formName.trim() && (
                  <p
                    className="text-[11px] text-[#4A6358] mt-1 font-mono truncate"
                    title={`/?to=${encodeURIComponent(formName.trim())}`}
                  >
                    Preview URL:{" "}
                    {truncateText(
                      `/?to=${encodeURIComponent(formName.trim())}`,
                      42
                    )}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#243830] mb-1.5">
                    Kategori / Grup *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as GuestCategory)
                    }
                    className="h-11 w-full px-3.5 rounded-xl border border-[#E5D1A7] bg-[#FAF7F2]/60 text-sm text-[#222624] focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#243830] mb-1.5">
                    Kuota Maksimal (Max Pax) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={formMaxPax}
                    onChange={(e) =>
                      setFormMaxPax(
                        Math.max(1, Math.min(10, Number(e.target.value) || 1))
                      )
                    }
                    className="h-11 w-full px-3.5 rounded-xl border border-[#E5D1A7] bg-[#FAF7F2]/60 text-sm text-[#222624] focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#243830] mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  className="h-11 w-full px-3.5 rounded-xl border border-[#E5D1A7] bg-[#FAF7F2]/60 text-sm text-[#222624] focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:bg-white"
                />
                <p className="text-[11px] text-[#4A6358] mt-1">
                  Otomatis diformat ke kode negara Indonesia (628...) saat dikirim.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-[#E5D1A7] text-xs font-semibold text-[#4A6358] hover:text-[#243830] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 rounded-xl bg-[#243830] hover:bg-[#1a2923] text-[#FAF7F2] text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingGuest
                      ? "Simpan Perubahan"
                      : "Tambahkan Tamu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Tamu */}
      <ConfirmModal
        isOpen={!!guestToDelete}
        onClose={() => {
          if (!isDeletingGuest) setGuestToDelete(null);
        }}
        onConfirm={handleConfirmDeleteGuest}
        title="Hapus Tamu Undangan"
        description={
          <span>
            Apakah Anda yakin ingin menghapus data tamu{" "}
            <strong
              className="text-[#243830]"
              title={guestToDelete?.name}
            >
              {truncateText(guestToDelete?.name, 20)}
            </strong>
            ? Data konfirmasi RSVP dan riwayat kehadiran terkait juga akan
            dihapus secara permanen.
          </span>
        }
        confirmText="Ya, Hapus Tamu"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingGuest}
      />
    </div>
  );
}
