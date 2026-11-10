"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  RotateCcw,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  Music,
  MessageCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  renderWhatsAppTemplate,
  type BankAccount,
  type WeddingContentConfig,
  type WeddingEventDetail,
} from "@/lib/config/wedding-config";
import { ConfirmModal } from "./ConfirmModal";

type ContentTabId =
  | "couple"
  | "quote"
  | "events"
  | "gifts"
  | "audio"
  | "whatsapp";

const TABS: {
  id: ContentTabId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
    {
      id: "couple",
      label: "1. Mempelai & Tanggal",
      subtitle: "Nama mempelai, orang tua, tanggal & hashtag",
      icon: Users,
    },
    {
      id: "events",
      label: "2. Acara & Alamat Lokasi",
      subtitle: "Akad nikah, resepsi, gedung & Google Maps",
      icon: Calendar,
    },
    {
      id: "quote",
      label: "3. Kutipan & Ayat",
      subtitle: "Teks Arab, terjemahan & sumber surat",
      icon: BookOpen,
    },
    {
      id: "gifts",
      label: "4. Rekening, QRIS & Kado",
      subtitle: "Daftar rekening bank, QRIS & alamat kiriman",
      icon: CreditCard,
    },
    {
      id: "audio",
      label: "5. Musik Latar",
      subtitle: "Judul lagu, artis & file audio MP3",
      icon: Music,
    },
    {
      id: "whatsapp",
      label: "6. Template Pesan WA",
      subtitle: "Format teks undangan WhatsApp otomatis",
      icon: MessageCircle,
    },
  ];

const WHATSAPP_TOKENS: { token: string; desc: string }[] = [
  { token: "{nama_tamu}", desc: "Nama Tamu" },
  { token: "{link_undangan}", desc: "Tautan Undangan Unik" },
  { token: "{tanggal_acara}", desc: "Hari & Tanggal" },
  { token: "{waktu_akad}", desc: "Jam Akad Nikah" },
  { token: "{waktu_resepsi}", desc: "Jam Resepsi" },
  { token: "{lokasi_acara}", desc: "Nama Gedung/Venue" },
  { token: "{alamat_acara}", desc: "Alamat Lengkap" },
  { token: "{mempelai_pria}", desc: "Panggilan Pria" },
  { token: "{mempelai_wanita}", desc: "Panggilan Wanita" },
  { token: "{mempelai_pria_lengkap}", desc: "Nama Lengkap Pria" },
  { token: "{mempelai_wanita_lengkap}", desc: "Nama Lengkap Wanita" },
];

export default function WeddingContentClient({
  initialConfig,
}: {
  initialConfig: WeddingContentConfig;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<WeddingContentConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<ContentTabId>("couple");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal confirmation states
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteAudioConfirmOpen, setIsDeleteAudioConfirmOpen] = useState(false);
  const [accountIndexToDelete, setAccountIndexToDelete] = useState<number | null>(null);

  const handleAudioFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate max 20 MB
    if (file.size > 20 * 1024 * 1024) {
      setFeedback({
        type: "error",
        text: "Ukuran file lagu terlalu besar (maksimal 20 MB).",
      });
      return;
    }

    setUploadingAudio(true);
    setAudioUploadProgress(5);
    setFeedback(null);

    try {
      const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5 MB per chunk (safe for Vercel 4.5MB body limit)
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      let finalAudioSrc = `/api/audio?v=${Date.now()}`;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const blobChunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", blobChunk);
        formData.append("fileName", file.name);
        formData.append("mimeType", file.type || "audio/mpeg");
        formData.append("chunkIndex", String(chunkIndex));
        formData.append("totalChunks", String(totalChunks));

        const res = await fetch("/api/audio", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as {
          done?: boolean;
          src?: string;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Gagal mengunggah file MP3.");
        }

        if (data.src) {
          finalAudioSrc = data.src;
        }

        setAudioUploadProgress(
          Math.round(((chunkIndex + 1) / totalChunks) * 90)
        );
      }

      // Derive clean song title if default is still set
      const cleanTitleFromFile = file.name.replace(/\.[^/.]+$/, "");
      const nextConfig: WeddingContentConfig = {
        ...config,
        audio: {
          ...config.audio,
          title:
            config.audio.title === "Clair de Lune, Romantic Piano Suite" &&
              cleanTitleFromFile
              ? cleanTitleFromFile
              : config.audio.title,
          src: finalAudioSrc,
        },
      };

      setConfig(nextConfig);
      setUploadedFileName(file.name);

      // Immediately persist the updated audio src to settings DB
      const saveRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: nextConfig }),
      });

      setAudioUploadProgress(100);

      if (saveRes.ok) {
        setFeedback({
          type: "success",
          text: `Lagu "${file.name}" berhasil diunggah dan langsung diaktifkan sebagai musik latar undangan!`,
        });
        router.refresh();
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengunggah file MP3.",
      });
    } finally {
      setUploadingAudio(false);
      e.target.value = "";
    }
  };

  const handleUseDefaultSynthAudio = async () => {
    setUploadingAudio(true);
    setFeedback(null);
    try {
      await fetch("/api/audio", { method: "DELETE" });
      const nextConfig: WeddingContentConfig = {
        ...config,
        audio: {
          ...config.audio,
          src: "/audio/wedding-theme.mp3",
        },
      };
      setConfig(nextConfig);
      setUploadedFileName(null);

      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: nextConfig }),
      });

      setFeedback({
        type: "success",
        text: "Kembali menggunakan musik instrumen romantis bawaan.",
      });
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Gagal mereset musik latar.",
      });
    } finally {
      setUploadingAudio(false);
    }
  };

  useEffect(() => {
    const requestedTab = searchParams.get("tab") as ContentTabId | null;
    if (requestedTab && TABS.some((t) => t.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  const updateGroom = (
    field: keyof WeddingContentConfig["couple"]["groom"],
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      couple: {
        ...prev.couple,
        groom: {
          ...prev.couple.groom,
          [field]: value,
        },
      },
    }));
  };

  const updateBride = (
    field: keyof WeddingContentConfig["couple"]["bride"],
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      couple: {
        ...prev.couple,
        bride: {
          ...prev.couple.bride,
          [field]: value,
        },
      },
    }));
  };

  const updateCoupleMeta = (
    field: "hashtag" | "weddingDateIso" | "weddingDateDisplay" | "shortDate",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      couple: {
        ...prev.couple,
        [field]: value,
      },
    }));
  };

  const updateQuote = (
    field: keyof WeddingContentConfig["quote"],
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      quote: {
        ...prev.quote,
        [field]: value,
      },
    }));
  };

  const updateEvent = (
    index: number,
    field: keyof WeddingEventDetail,
    value: string
  ) => {
    setConfig((prev) => {
      const nextEvents = prev.events.map((ev, i) =>
        i === index ? { ...ev, [field]: value } : ev
      );
      return {
        ...prev,
        events: nextEvents,
      };
    });
  };

  const updateBankAccount = (
    index: number,
    field: keyof BankAccount,
    value: string
  ) => {
    setConfig((prev) => {
      const nextAccounts = prev.gifts.accounts.map((acc, i) =>
        i === index ? { ...acc, [field]: value } : acc
      );
      return {
        ...prev,
        gifts: {
          ...prev.gifts,
          accounts: nextAccounts,
        },
      };
    });
  };

  const addBankAccount = () => {
    setConfig((prev) => ({
      ...prev,
      gifts: {
        ...prev.gifts,
        accounts: [
          ...prev.gifts.accounts,
          {
            id: `bank-${Date.now()}`,
            bankName: "Nama Bank",
            accountNumber: "0000000000",
            accountHolder: prev.couple.groom.fullName,
            branch: "Jakarta",
          },
        ],
      },
    }));
  };

  const removeBankAccount = (index: number) => {
    if (config.gifts.accounts.length <= 1) return;
    setAccountIndexToDelete(index);
  };

  const handleConfirmRemoveBankAccount = () => {
    if (accountIndexToDelete === null) return;
    const index = accountIndexToDelete;
    if (config.gifts.accounts.length <= 1) return;
    setConfig((prev) => ({
      ...prev,
      gifts: {
        ...prev.gifts,
        accounts: prev.gifts.accounts.filter((_, i) => i !== index),
      },
    }));
    setAccountIndexToDelete(null);
  };

  const updateQris = (
    field: keyof WeddingContentConfig["gifts"]["qris"],
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      gifts: {
        ...prev.gifts,
        qris: {
          ...prev.gifts.qris,
          [field]: value,
        },
      },
    }));
  };

  const updateShippingAddress = (
    field: keyof WeddingContentConfig["gifts"]["shippingAddress"],
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      gifts: {
        ...prev.gifts,
        shippingAddress: {
          ...prev.gifts.shippingAddress,
          [field]: value,
        },
      },
    }));
  };

  const updateAudio = (
    field: keyof WeddingContentConfig["audio"],
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      audio: {
        ...prev.audio,
        [field]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      const result = (await response.json()) as {
        data?: WeddingContentConfig;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.data) {
        setFeedback({
          type: "error",
          text:
            result.error ||
            "Gagal menyimpan perubahan konten. Periksa kembali isian Anda.",
        });
        return;
      }

      setConfig(result.data);
      setFeedback({
        type: "success",
        text:
          result.message ||
          "Perubahan konten undangan berhasil disimpan dan aktif di halaman utama.",
      });
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        text: "Terjadi gangguan jaringan saat menyimpan perubahan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmResetDefault = async () => {
    setResetting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToDefault: true }),
      });

      const result = (await response.json()) as {
        data?: WeddingContentConfig;
        message?: string;
        error?: string;
      };

      if (response.ok && result.data) {
        setConfig(result.data);
        setFeedback({
          type: "success",
          text:
            result.message ||
            "Konten undangan telah dikembalikan ke pengaturan awal.",
        });
        setIsResetConfirmOpen(false);
        router.refresh();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Gagal mereset konfigurasi konten.",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5D1A7]/60 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C5A059]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Manajemen Konten &amp; Informasi Acara</span>
          </div>
          <h1 className="font-serif-luxury text-2xl font-semibold text-[#243830] sm:text-3xl">
            Pengaturan Konten Undangan
          </h1>
          <p className="mt-1 text-xs text-[#4A6358]">
            Ubah nama mempelai, nama orang tua, jadwal &amp; alamat gedung,
            tautan Google Maps, hingga nomor rekening amplop digital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C5A059]/50 bg-[#FAF7F2] px-4 py-2.5 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#F2ECE1]"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>Lihat Undangan Live</span>
          </a>

          <button
            type="button"
            disabled={resetting || saving}
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#4A6358] transition-colors hover:bg-stone-50 hover:text-[#1C2B24] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{resetting ? "Mereset..." : "Reset Default"}</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#243830] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#FAF7F2] shadow-sm transition-colors hover:bg-[#1C2B24] disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-[#E5D1A7]" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-[#E5D1A7]" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-xs ${feedback.type === "success"
              ? "border-emerald-700/40 bg-emerald-50 text-emerald-950"
              : "border-rose-600/40 bg-rose-50 text-rose-900"
            }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{feedback.text}</p>
          </div>
        </div>
      )}

      {/* Section Navigation Sub-Tabs */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-14 cursor-pointer flex-col items-start justify-between rounded-xl border p-3.5 text-left transition-colors ${isActive
                  ? "border-[#243830] bg-[#243830] text-[#FAF7F2] shadow-xs"
                  : "border-[#C5A059]/35 bg-white text-[#222624] hover:bg-[#FAF7F2]"
                }`}
            >
              <div className="flex w-full items-center gap-2">
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-[#E5D1A7]" : "text-[#8A6825]"
                    }`}
                />
                <span className="truncate text-xs font-semibold">
                  {tab.label}
                </span>
              </div>
              <span
                className={`mt-1 line-clamp-1 text-[11px] leading-snug ${isActive ? "text-[#E5D1A7]/85" : "text-[#4A6358]"
                  }`}
              >
                {tab.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MEMPELAI & TANGGAL */}
      {activeTab === "couple" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Groom Form */}
            <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  01 / Mempelai Pria
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Profil Mempelai Pria
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Panggilan *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.groom.nickname}
                      onChange={(e) => updateGroom("nickname", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Urutan Anak *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Putra Pertama"
                      value={config.couple.groom.childOrder}
                      onChange={(e) =>
                        updateGroom("childOrder", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Lengkap &amp; Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.couple.groom.fullName}
                    onChange={(e) => updateGroom("fullName", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Ayah *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.groom.fatherName}
                      onChange={(e) =>
                        updateGroom("fatherName", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Ibu *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.groom.motherName}
                      onChange={(e) =>
                        updateGroom("motherName", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Username Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={config.couple.groom.instagram}
                    onChange={(e) => updateGroom("instagram", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>

            {/* Bride Form */}
            <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  02 / Mempelai Wanita
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Profil Mempelai Wanita
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Panggilan *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.bride.nickname}
                      onChange={(e) => updateBride("nickname", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Urutan Anak *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Putri Kedua"
                      value={config.couple.bride.childOrder}
                      onChange={(e) =>
                        updateBride("childOrder", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Lengkap &amp; Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.couple.bride.fullName}
                    onChange={(e) => updateBride("fullName", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Ayah *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.bride.fatherName}
                      onChange={(e) =>
                        updateBride("fatherName", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Ibu *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.bride.motherName}
                      onChange={(e) =>
                        updateBride("motherName", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Username Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={config.couple.bride.instagram}
                    onChange={(e) => updateBride("instagram", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wedding Date & Hashtag */}
          <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
            <div className="border-b border-[#F2ECE1] pb-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                03 / Tanggal Utama &amp; Tagar Pernikahan
              </p>
              <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                Waktu Hitung Mundur &amp; Tampilan Tanggal
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col justify-end">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Tampilan Hari &amp; Tanggal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sabtu, 12 Desember 2026"
                  value={config.couple.weddingDateDisplay}
                  onChange={(e) =>
                    updateCoupleMeta("weddingDateDisplay", e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Tanggal Angka Singkat *
                </label>
                <input
                  type="text"
                  required
                  placeholder="12 . 12 . 2026"
                  value={config.couple.shortDate}
                  onChange={(e) =>
                    updateCoupleMeta("shortDate", e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24] tabular-nums"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Target Countdown (ISO) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="2026-12-12T08:00:00+07:00"
                  value={config.couple.weddingDateIso}
                  onChange={(e) =>
                    updateCoupleMeta("weddingDateIso", e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 font-mono text-xs text-[#1C2B24] tabular-nums"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Tagar / Hashtag *
                </label>
                <input
                  type="text"
                  required
                  placeholder="#ArkaFoundHisNadia"
                  value={config.couple.hashtag}
                  onChange={(e) => updateCoupleMeta("hashtag", e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACARA & ALAMAT LOKASI */}
      {activeTab === "events" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {config.events.map((event, idx) => (
            <div
              key={event.id}
              className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs"
            >
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Acara 0{idx + 1} ({event.id.toUpperCase()})
                </p>
                <h2
                  className="mt-1 truncate font-serif-luxury text-2xl font-semibold text-[#1C2B24]"
                  title={event.title}
                >
                  {event.title}
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Judul Acara *
                    </label>
                    <input
                      type="text"
                      required
                      value={event.title}
                      onChange={(e) =>
                        updateEvent(idx, "title", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Subjudul Acara *
                    </label>
                    <input
                      type="text"
                      required
                      value={event.subtitle}
                      onChange={(e) =>
                        updateEvent(idx, "subtitle", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Hari &amp; Tanggal Acara *
                    </label>
                    <input
                      type="text"
                      required
                      value={event.dateDisplay}
                      onChange={(e) =>
                        updateEvent(idx, "dateDisplay", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Jam Pelaksanaan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="08.00 - 10.00 WIB"
                      value={event.timeDisplay}
                      onChange={(e) =>
                        updateEvent(idx, "timeDisplay", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24] tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Gedung / Venue *
                  </label>
                  <input
                    type="text"
                    required
                    value={event.venueName}
                    onChange={(e) =>
                      updateEvent(idx, "venueName", e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Alamat Lengkap Lokasi *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={event.venueAddress}
                    onChange={(e) =>
                      updateEvent(idx, "venueAddress", e.target.value)
                    }
                    className="w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Tautan Navigasi Google Maps *
                  </label>
                  <input
                    type="url"
                    required
                    value={event.googleMapsUrl}
                    onChange={(e) =>
                      updateEvent(idx, "googleMapsUrl", e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 font-mono text-xs text-[#1C2B24]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    URL Embed Peta Google Maps (Iframe) *
                  </label>
                  <input
                    type="url"
                    required
                    value={event.googleMapsEmbedUrl}
                    onChange={(e) =>
                      updateEvent(idx, "googleMapsEmbedUrl", e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 font-mono text-xs text-[#1C2B24]"
                  />
                  <p className="mt-1 text-[11px] text-[#4A6358] break-all">
                    Format cepat:{" "}
                    <code>
                      https://www.google.com/maps?q=Nama+Tempat&amp;output=embed
                    </code>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: KUTIPAN & AYAT */}
      {activeTab === "quote" && (
        <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
          <div className="border-b border-[#F2ECE1] pb-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
              Kutipan Pembuka Undangan
            </p>
            <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
              Ayat Suci / Kutipan Doa Pernikahan
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                Teks Kaligrafi Arab / Kutipan Utama *
              </label>
              <textarea
                rows={3}
                dir="rtl"
                required
                value={config.quote.arabic}
                onChange={(e) => updateQuote("arabic", e.target.value)}
                className="w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-3 font-serif-luxury text-xl leading-loose text-[#1C2B24]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                Terjemahan Bahasa Indonesia *
              </label>
              <textarea
                rows={3}
                required
                value={config.quote.translation}
                onChange={(e) => updateQuote("translation", e.target.value)}
                className="w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm leading-relaxed text-[#1C2B24]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                Sumber Surat / Kutipan *
              </label>
              <input
                type="text"
                required
                placeholder="QS. Ar-Rum: 21"
                value={config.quote.source}
                onChange={(e) => updateQuote("source", e.target.value)}
                className="min-h-11 w-full max-w-md rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKENING, QRIS & ALAMAT KADO */}
      {activeTab === "gifts" && (
        <div className="space-y-6">
          {/* Bank Accounts */}
          <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2ECE1] pb-3.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Amplop Digital
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Daftar Rekening Transfer Bank
                </h2>
              </div>

              <button
                type="button"
                onClick={addBankAccount}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#C5A059]/50 bg-[#FAF7F2] px-3.5 py-2 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#F2ECE1]"
              >
                <Plus className="h-3.5 w-3.5 text-[#8A6825]" />
                <span>Tambah Rekening</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {config.gifts.accounts.map((acc, idx) => (
                <div
                  key={acc.id}
                  className="space-y-3.5 rounded-xl border border-[#C5A059]/35 bg-[#FAF7F2]/60 p-4"
                >
                  <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Rekening #{idx + 1}
                    </span>
                    {config.gifts.accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBankAccount(idx)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Bank *
                    </label>
                    <input
                      type="text"
                      required
                      value={acc.bankName}
                      onChange={(e) =>
                        updateBankAccount(idx, "bankName", e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-[#C5A059]/45 bg-white px-3 text-sm text-[#1C2B24]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col justify-end">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                        Nomor Rekening *
                      </label>
                      <input
                        type="text"
                        required
                        value={acc.accountNumber}
                        onChange={(e) =>
                          updateBankAccount(
                            idx,
                            "accountNumber",
                            e.target.value
                          )
                        }
                        className="h-10 w-full rounded-xl border border-[#C5A059]/45 bg-white px-3 font-mono text-sm text-[#1C2B24] tabular-nums"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                        Atas Nama Pemilik *
                      </label>
                      <input
                        type="text"
                        required
                        value={acc.accountHolder}
                        onChange={(e) =>
                          updateBankAccount(
                            idx,
                            "accountHolder",
                            e.target.value
                          )
                        }
                        className="h-10 w-full rounded-xl border border-[#C5A059]/45 bg-white px-3 text-sm text-[#1C2B24]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Kantor Cabang (Opsional)
                    </label>
                    <input
                      type="text"
                      value={acc.branch ?? ""}
                      onChange={(e) =>
                        updateBankAccount(idx, "branch", e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-[#C5A059]/45 bg-white px-3 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QRIS & Physical Shipping Address */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Pembayaran QRIS
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Identitas Merchant QRIS
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Merchant QRIS *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.gifts.qris.merchantName}
                    onChange={(e) => updateQris("merchantName", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nomor NMID *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.gifts.qris.nmid}
                    onChange={(e) => updateQris("nmid", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 font-mono text-sm text-[#1C2B24] tabular-nums"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    String Payload QRIS *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={config.gifts.qris.codePayload}
                    onChange={(e) => updateQris("codePayload", e.target.value)}
                    className="w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 font-mono text-xs text-[#1C2B24] break-all"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Kado Pernikahan Fisik
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Alamat Pengiriman Kado
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Penerima Paket *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.gifts.shippingAddress.recipient}
                    onChange={(e) =>
                      updateShippingAddress("recipient", e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nomor Telepon Penerima / Kurir *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.gifts.shippingAddress.phone}
                    onChange={(e) =>
                      updateShippingAddress("phone", e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 font-mono text-sm text-[#1C2B24] tabular-nums"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Alamat Lengkap Pengiriman *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={config.gifts.shippingAddress.address}
                    onChange={(e) =>
                      updateShippingAddress("address", e.target.value)
                    }
                    className="w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MUSIK LATAR */}
      {activeTab === "audio" && (
        <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2ECE1] pb-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                Pengaturan Audio Undangan
              </p>
              <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                Upload Lagu &amp; Musik Latar (MP3)
              </h2>
            </div>

            {config.audio.src.startsWith("/api/audio") && (
              <button
                type="button"
                disabled={uploadingAudio}
                onClick={() => setIsDeleteAudioConfirmOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus MP3 &amp; Gunakan Musik Bawaan</span>
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Song Title & Artist */}
            <div className="space-y-4 lg:col-span-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Judul Lagu *
                </label>
                <input
                  type="text"
                  required
                  value={config.audio.title}
                  onChange={(e) => updateAudio("title", e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Nama Penyanyi / Artis *
                </label>
                <input
                  type="text"
                  required
                  value={config.audio.artist}
                  onChange={(e) => updateAudio("artist", e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                />
              </div>

              <div className="rounded-xl border border-[#C5A059]/30 bg-[#FAF7F2] p-3.5 text-xs text-[#4A6358]">
                <p className="font-semibold text-[#243830]">
                  Status Musik Saat Ini:
                </p>
                <p className="mt-1">
                  {config.audio.src.startsWith("/api/audio") ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Menggunakan File MP3 Kustom Anda
                      {uploadedFileName ? ` (${uploadedFileName})` : ""}
                    </span>
                  ) : (
                    <span>
                      Menggunakan Musik Instrumen Piano Romantis Bawaan
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Right Column: File Upload Dropzone & Preview Player */}
            <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Pilih / Upload File Lagu MP3 dari Perangkat
                </label>

                <label
                  className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${uploadingAudio
                      ? "border-[#C5A059] bg-[#FAF7F2]"
                      : "border-[#C5A059]/50 bg-[#FAF7F2]/60 hover:border-[#243830] hover:bg-[#F2ECE1]/60"
                    }`}
                >
                  <input
                    type="file"
                    accept=".mp3,audio/mpeg,audio/mp3,audio/*"
                    disabled={uploadingAudio}
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />

                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#243830] text-[#E5D1A7] shadow-sm">
                    {uploadingAudio ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>

                  {uploadingAudio ? (
                    <div className="w-full max-w-xs space-y-2">
                      <p className="text-xs font-semibold text-[#243830]">
                        Mengunggah &amp; Menyimpan File MP3...{" "}
                        {audioUploadProgress}%
                      </p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5D1A7]/40">
                        <div
                          className="h-full rounded-full bg-[#243830] transition-all duration-200"
                          style={{ width: `${audioUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#1C2B24]">
                        Klik di sini untuk memilih file lagu{" "}
                        <span className="text-[#8A6825]">.MP3</span>
                      </p>
                      <p className="mt-1 text-xs text-[#4A6358]">
                        Mendukung format MP3, M4A, atau WAV (Maks. 20 MB). Lagu
                        otomatis tersimpan ke database cloud setelah dipilih.
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Built-in Audio Preview Player when custom MP3 is active */}
              {config.audio.src.startsWith("/api/audio") && (
                <div className="rounded-2xl border border-[#C5A059]/40 bg-[#1C2B24] p-4 text-[#FAF7F2]">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="shrink-0 font-semibold text-[#E5D1A7]">
                      Putar Pratinjau Lagu MP3:
                    </span>
                    <span
                      className="truncate text-[11px] text-[#FAF7F2]/70"
                      title={`${config.audio.title} — ${config.audio.artist}`}
                    >
                      {config.audio.title} — {config.audio.artist}
                    </span>
                  </div>
                  <audio
                    key={config.audio.src}
                    controls
                    src={config.audio.src}
                    className="h-10 w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TEMPLATE PESAN WHATSAPP */}
      {activeTab === "whatsapp" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Template Editor */}
          <div className="rounded-2xl border border-[#C5A059]/40 bg-white p-6 shadow-xs lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2ECE1] pb-3.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Pengiriman Undangan Personal
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Template Pesan WhatsApp
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
                  }))
                }
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#F2ECE1]"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#C5A059]" />
                <span>Kembalikan Format WA Standar</span>
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs leading-relaxed text-[#4A6358]">
                Klik variabel di bawah ini untuk menyisipkan kode otomatis ke
                dalam template pesan. Saat tombol{" "}
                <strong>Kirim WhatsApp</strong> diklik di menu Tamu, variabel
                tersebut akan otomatis diganti dengan nama tamu dan tautan
                undangan uniknya.
              </p>

              {/* Clickable Placeholder Chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {WHATSAPP_TOKENS.map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappTemplate: `${prev.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE} ${item.token}`,
                      }))
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#C5A059]/40 bg-[#FAF7F2] px-2.5 py-1.5 text-[11px] font-medium text-[#243830] transition-colors hover:bg-[#243830] hover:text-[#FAF7F2]"
                    title={`Sisipkan ${item.desc}`}
                  >
                    <code className="font-mono font-semibold text-[#8A6825] group-hover:text-[#E5D1A7]">
                      {item.token}
                    </code>
                    <span className="text-[10px] opacity-75">
                      ({item.desc})
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Isi Template Pesan WhatsApp *
                </label>
                <textarea
                  rows={16}
                  required
                  value={config.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      whatsappTemplate: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#C5A059]/45 bg-[#FAF7F2] p-4 font-sans text-xs leading-relaxed text-[#1C2B24] focus:border-[#243830] focus:bg-white focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-[#4A6358]">
                  Tips: Gunakan tanda bintang <code>*teks*</code> untuk huruf
                  tebal (bold) dan garis bawah <code>_teks_</code> untuk huruf
                  miring (italic) di WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* Live WhatsApp Bubble Preview */}
          <div className="rounded-2xl border border-[#C5A059]/40 bg-[#1C2B24] p-6 text-[#FAF7F2] shadow-xs lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="border-b border-white/10 pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5D1A7]">
                  Pratinjau Langsung (Live Preview)
                </p>
                <h3 className="mt-1 font-serif-luxury text-2xl font-semibold text-white">
                  Simulasi Tampilan di WhatsApp
                </h3>
                <p className="mt-0.5 text-xs text-[#FAF7F2]/70">
                  Contoh untuk tamu:{" "}
                  <strong className="text-[#E5D1A7]">
                    Bpk. H. Ahmad Subarjo &amp; Keluarga
                  </strong>
                </p>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-[#C5A059]/30 bg-[#DCF8C6] p-4 text-[#111B21] shadow-md">
                <pre className="whitespace-pre-wrap break-all sm:break-words font-sans text-xs leading-relaxed">
                  {renderWhatsAppTemplate(
                    "Bpk. H. Ahmad Subarjo & Keluarga",
                    "https://wedding-invitation-eight-tau-88.vercel.app/?to=Bpk.%20H.%20Ahmad%20Subarjo%20%26%20Keluarga",
                    config
                  )}
                </pre>
                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-900/70">
                  <span>12.00 WIB</span>
                  <span>✓✓</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-[#E5D1A7]/80">
              Jangan lupa klik tombol <strong>Simpan Perubahan</strong> di kanan
              atas setelah selesai mengubah format pesan WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Reset Default */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => {
          if (!resetting) setIsResetConfirmOpen(false);
        }}
        onConfirm={handleConfirmResetDefault}
        title="Reset Pengaturan Konten"
        description="Apakah Anda yakin ingin mengembalikan seluruh teks, nama mempelai, jadwal acara, dan rekening ke data contoh awal? Perubahan kustom saat ini yang belum tersimpan akan hilang."
        confirmText="Ya, Reset Default"
        cancelText="Batal"
        variant="warning"
        isLoading={resetting}
      />

      {/* Modal Konfirmasi Hapus File Musik MP3 */}
      <ConfirmModal
        isOpen={isDeleteAudioConfirmOpen}
        onClose={() => {
          if (!uploadingAudio) setIsDeleteAudioConfirmOpen(false);
        }}
        onConfirm={async () => {
          setIsDeleteAudioConfirmOpen(false);
          await handleUseDefaultSynthAudio();
        }}
        title="Hapus Musik MP3 Kustom"
        description="Apakah Anda yakin ingin menghapus file lagu MP3 yang telah diunggah dan beralih kembali ke musik instrumen romantis bawaan?"
        confirmText="Ya, Hapus Musik"
        cancelText="Batal"
        variant="danger"
        isLoading={uploadingAudio}
      />

      {/* Modal Konfirmasi Hapus Rekening Bank */}
      <ConfirmModal
        isOpen={accountIndexToDelete !== null}
        onClose={() => setAccountIndexToDelete(null)}
        onConfirm={handleConfirmRemoveBankAccount}
        title="Hapus Rekening Bank"
        description={
          accountIndexToDelete !== null && config.gifts.accounts[accountIndexToDelete] ? (
            <span>
              Hapus rekening{" "}
              <strong className="text-[#243830]">
                {config.gifts.accounts[accountIndexToDelete].bankName || "Bank"}{" "}
                - {config.gifts.accounts[accountIndexToDelete].accountNumber}
              </strong>{" "}
              dari daftar amplop digital?
            </span>
          ) : (
            "Hapus rekening bank ini dari daftar amplop digital?"
          )
        }
        confirmText="Ya, Hapus Rekening"
        cancelText="Batal"
        variant="danger"
      />
    </form>
  );
}

