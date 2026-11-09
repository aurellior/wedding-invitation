"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  XCircle,
  HelpCircle,
  Phone,
  Users,
  AlertCircle,
} from "lucide-react";
import type {
  AttendanceStatus,
  Guest,
  GuestCategory,
  RsvpRecord,
} from "@/types/wedding";
import { WEDDING_CONFIG } from "@/lib/config/wedding-config";

const CATEGORIES: GuestCategory[] = [
  "VIP",
  "Keluarga",
  "Sahabat",
  "Rekan Kerja",
  "Umum",
];

export function normalizeIndonesianPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

export function buildPersonalizedUrl(
  origin: string,
  guestName: string
): string {
  const baseUrl = origin || "http://localhost:3000";
  return `${baseUrl}/?to=${encodeURIComponent(guestName.trim())}`;
}

export function buildWhatsAppMessage(
  guestName: string,
  invitationUrl: string
): string {
  const akad = WEDDING_CONFIG.events[0];
  const resepsi = WEDDING_CONFIG.events[1];

  return [
    `Kepada Yth. *${guestName}*`,
    `Di Tempat`,
    ``,
    `Assalamu’alaikum Warahmatullahi Wabarakatuh / Salam Sejahtera.`,
    ``,
    `Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami:`,
    ``,
    `*${WEDDING_CONFIG.couple.groom.fullName}*`,
    `&`,
    `*${WEDDING_CONFIG.couple.bride.fullName}*`,
    ``,
    `Hari/Tanggal: ${WEDDING_CONFIG.couple.weddingDateDisplay}`,
    `${akad.title}: ${akad.timeDisplay}`,
    `${resepsi.title}: ${resepsi.timeDisplay}`,
    `Lokasi: ${resepsi.venueName}`,
    ``,
    `Silakan buka tautan undangan digital personal berikut untuk informasi lengkap & konfirmasi kehadiran (RSVP):`,
    `${invitationUrl}`,
    ``,
    `Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.`,
    ``,
    `Kami yang berbahagia,`,
    `*${WEDDING_CONFIG.couple.groom.nickname} & ${WEDDING_CONFIG.couple.bride.nickname}*`,
  ].join("\n");
}

function CategoryBadge({ category }: { category: GuestCategory }) {
  const styles: Record<GuestCategory, string> = {
    VIP: "bg-[#C5A059]/20 text-[#243830] border-[#C5A059]/50",
    Keluarga: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Sahabat: "bg-sky-50 text-sky-800 border-sky-200",
    "Rekan Kerja": "bg-amber-50 text-amber-900 border-amber-200",
    Umum: "bg-stone-100 text-stone-700 border-stone-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold ${styles[category]}`}
    >
      {category}
    </span>
  );
}

function RsvpStatusBadge({
  status,
  pax,
}: {
  status?: AttendanceStatus;
  pax?: number;
}) {
  if (status === "hadir") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 tabular-nums">
        <CheckCircle2 className="h-3 w-3" />
        Hadir ({pax ?? 1} Pax)
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
      <span className="inline-flex items-center gap-1 rounded-sm border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 tabular-nums">
        <HelpCircle className="h-3 w-3" />
        Masih Ragu ({pax ?? 1} Pax)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
      <Clock className="h-3 w-3" />
      Belum RSVP
    </span>
  );
}

interface GuestManagementClientProps {
  initialGuests: Guest[];
  initialRsvps: RsvpRecord[];
}

export default function GuestManagementClient({
  initialGuests,
  initialRsvps,
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

  // R-26 & R-32: Allow Escape key to close the Add/Edit Guest Modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

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

  const handleDeleteGuest = async (guest: Guest) => {
    const confirmed = window.confirm(
      `Hapus tamu "${guest.name}" beserta data konfirmasi RSVP terkait?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/guests?id=${encodeURIComponent(guest.id)}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setGuests((prev) => prev.filter((item) => item.id !== guest.id));
        router.refresh();
      }
    } catch {
      // Ignore network error
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
    const message = buildWhatsAppMessage(guest.name, personalizedUrl);
    const normalizedPhone = normalizeIndonesianPhone(guest.phone);

    const waUrl = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");

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
      <div className="flex flex-col gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
            Daftar Tamu &amp; Pengiriman WhatsApp
          </p>
          <h1 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24] sm:text-3xl">
            Manajemen Tamu Undangan
          </h1>
          <p className="mt-1 text-xs text-[#4A6358] tabular-nums">
            Total <strong>{guests.length} tamu</strong> terdaftar (
            {totalQuotaPax} kuota kursi) • <strong>{sentCount}</strong> undangan
            telah dikirim
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-[#243830] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24]"
        >
          <UserPlus className="h-4 w-4 text-[#E5D1A7]" />
          <span>Tambah Tamu Undangan</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-4 sm:p-5 lg:flex-row lg:items-center">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {["Semua", ...CATEGORIES].map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-10 whitespace-nowrap rounded-sm px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#243830] text-[#FAF7F2]"
                    : "border border-[#C5A059]/30 bg-[#FAF7F2] text-[#4A6358] hover:bg-[#F2ECE1] hover:text-[#1C2B24]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A6358]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari nama tamu atau nomor WhatsApp"
            placeholder="Cari nama tamu atau nomor WhatsApp..."
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

      {/* Guests Table */}
      <div className="overflow-hidden rounded-sm border border-[#C5A059]/40 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#C5A059]/30 bg-[#FAF7F2] text-[11px] font-semibold uppercase tracking-wider text-[#4A6358]">
                <th className="px-5 py-3.5">Nama Tamu</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">No. WhatsApp</th>
                <th className="px-4 py-3.5 text-center">Max Pax</th>
                <th className="px-4 py-3.5">Status RSVP</th>
                <th className="px-4 py-3.5">Status Undangan</th>
                <th className="px-5 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE1] text-xs">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-[#4A6358]"
                  >
                    <Users className="mx-auto mb-2 h-8 w-8 text-[#8A6825] opacity-70" />
                    <p className="text-sm font-semibold text-[#1C2B24]">
                      Tidak ada data tamu yang ditemukan
                    </p>
                    <p className="mt-1 text-xs text-[#4A6358]">
                      Ubah kata kunci pencarian atau tambahkan tamu baru.
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
                      className="transition-colors hover:bg-[#FAF7F2]/60"
                    >
                      {/* Nama Tamu */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-[#1C2B24]">
                          {guest.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#4A6358]/80">
                          /?to={encodeURIComponent(guest.name)}
                        </p>
                      </td>

                      {/* Kategori */}
                      <td className="px-4 py-4">
                        <CategoryBadge category={guest.category} />
                      </td>

                      {/* No. WhatsApp */}
                      <td className="px-4 py-4">
                        {guest.phone ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#222624] tabular-nums">
                            <Phone className="h-3 w-3 text-[#4A6358]" />
                            {guest.phone}
                          </span>
                        ) : (
                          <span className="italic text-[#4A6358]/60">
                            Belum diisi
                          </span>
                        )}
                      </td>

                      {/* Max Pax */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2] px-2.5 py-1 font-semibold text-[#1C2B24] tabular-nums">
                          {guest.max_pax} Orang
                        </span>
                      </td>

                      {/* Status RSVP */}
                      <td className="px-4 py-4">
                        <RsvpStatusBadge
                          status={rsvp?.attendance_status}
                          pax={rsvp?.pax}
                        />
                      </td>

                      {/* Status Undangan */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSentStatus(guest)}
                          title="Klik untuk mengubah status pengiriman"
                          className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            guest.invitation_sent
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {guest.invitation_sent ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Sudah Dikirim</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>Belum Dikirim</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Tindakan */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {/* Kirim WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(guest)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-900"
                            title="Kirim pesan undangan personal via WhatsApp"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Kirim WhatsApp</span>
                          </button>

                          {/* Salin Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(guest)}
                            className="inline-flex min-h-9 items-center gap-1 rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-2.5 py-1.5 text-xs font-medium text-[#243830] transition-colors hover:bg-[#F2ECE1]"
                            title="Salin tautan personal ?to="
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-700" />
                                <span className="font-semibold text-emerald-700">
                                  Tersalin
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-[#8A6825]" />
                                <span>Salin Tautan</span>
                              </>
                            )}
                          </button>

                          {/* Buka Preview Link */}
                          <a
                            href={previewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Buka pratinjau undangan untuk ${guest.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] text-[#243830] transition-colors hover:bg-[#F2ECE1]"
                            title="Buka pratinjau undangan tamu di tab baru"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          {/* Edit Tamu */}
                          <button
                            type="button"
                            onClick={() => openEditModal(guest)}
                            aria-label={`Edit data ${guest.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] text-[#243830] transition-colors hover:bg-[#F2ECE1]"
                            title="Edit data tamu"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Hapus Tamu */}
                          <button
                            type="button"
                            onClick={() => handleDeleteGuest(guest)}
                            aria-label={`Hapus ${guest.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100"
                            title="Hapus tamu"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-modal-title"
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-sm border border-[#C5A059]/50 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-[#1C2B24] px-6 py-5 text-[#FAF7F2]">
              <div>
                <h2
                  id="guest-modal-title"
                  className="font-serif-luxury text-2xl font-semibold"
                >
                  {editingGuest ? "Edit Data Tamu" : "Tambah Tamu Undangan"}
                </h2>
                <p className="mt-0.5 text-xs text-[#E5D1A7]/80">
                  Tentukan nama, kategori grup, nomor WhatsApp, dan kuota kursi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup dialog"
                className="flex h-10 w-10 items-center justify-center rounded-sm text-[#FAF7F2]/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="space-y-4 p-6">
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="guest-form-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                >
                  Nama Lengkap Tamu / Keluarga *
                </label>
                <input
                  id="guest-form-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dr. Andi Wijaya & Partner"
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#222624]"
                />
                {formName.trim() && (
                  <p className="mt-1 truncate font-mono text-[11px] text-[#4A6358]">
                    Tautan: /?to={encodeURIComponent(formName.trim())}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="guest-form-category"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                  >
                    Kategori / Grup *
                  </label>
                  <select
                    id="guest-form-category"
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as GuestCategory)
                    }
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#222624]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="guest-form-pax"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                  >
                    Kuota Maksimal (Max Pax) *
                  </label>
                  <input
                    id="guest-form-pax"
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
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#222624] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="guest-form-phone"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]"
                >
                  Nomor WhatsApp
                </label>
                <input
                  id="guest-form-phone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#222624] tabular-nums"
                />
                <p className="mt-1 text-[11px] text-[#4A6358]">
                  Otomatis diformat ke kode negara Indonesia (628...) saat
                  dikirim.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-[#F2ECE1] pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-11 rounded-sm border border-[#C5A059]/45 px-4 py-2.5 text-xs font-semibold text-[#4A6358] transition-colors hover:bg-[#FAF7F2] hover:text-[#1C2B24]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 rounded-sm bg-[#243830] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24] disabled:opacity-50"
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
    </div>
  );
}
