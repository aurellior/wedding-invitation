"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  RotateCcw,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  Music,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type {
  BankAccount,
  WeddingContentConfig,
  WeddingEventDetail,
} from "@/lib/config/wedding-config";

type ContentTabId = "couple" | "quote" | "events" | "gifts" | "audio";

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
];

export default function WeddingContentClient({
  initialConfig,
}: {
  initialConfig: WeddingContentConfig;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<WeddingContentConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<ContentTabId>("couple");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    setConfig((prev) => ({
      ...prev,
      gifts: {
        ...prev.gifts,
        accounts: prev.gifts.accounts.filter((_, i) => i !== index),
      },
    }));
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

  const handleResetDefault = async () => {
    const confirmed = window.confirm(
      "Kembalikan seluruh teks, nama mempelai, lokasi acara, dan rekening ke pengaturan contoh awal?"
    );
    if (!confirmed) return;

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
      <div className="flex flex-col gap-4 rounded-sm border border-[#C5A059]/40 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
            Manajemen Konten &amp; Informasi Acara
          </p>
          <h1 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24] sm:text-3xl">
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
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-[#C5A059]/50 bg-[#FAF7F2] px-4 py-2.5 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#F2ECE1]"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#8A6825]" />
            <span>Lihat Undangan Live</span>
          </a>

          <button
            type="button"
            disabled={resetting || saving}
            onClick={handleResetDefault}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#4A6358] transition-colors hover:bg-stone-50 hover:text-[#1C2B24] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{resetting ? "Mereset..." : "Reset Default"}</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-[#243830] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#FAF7F2] transition-colors hover:bg-[#1C2B24] disabled:opacity-60"
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
          className={`flex items-start gap-2.5 rounded-sm border p-4 text-xs ${
            feedback.type === "success"
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-11 flex-col items-start justify-between rounded-sm border p-3.5 text-left transition-colors ${
                isActive
                  ? "border-[#243830] bg-[#243830] text-[#FAF7F2]"
                  : "border-[#C5A059]/35 bg-white text-[#222624] hover:bg-[#FAF7F2]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-[#E5D1A7]" : "text-[#8A6825]"
                  }`}
                />
                <span className="text-xs font-semibold">{tab.label}</span>
              </div>
              <span
                className={`mt-1 text-[11px] leading-snug ${
                  isActive ? "text-[#E5D1A7]/85" : "text-[#4A6358]"
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
            <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
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
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Panggilan *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.groom.nickname}
                      onChange={(e) => updateGroom("nickname", e.target.value)}
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Lengkap &amp; Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.couple.groom.fullName}
                    onChange={(e) => updateGroom("fullName", e.target.value)}
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Username Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={config.couple.groom.instagram}
                    onChange={(e) => updateGroom("instagram", e.target.value)}
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>

            {/* Bride Form */}
            <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
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
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Nama Panggilan *
                    </label>
                    <input
                      type="text"
                      required
                      value={config.couple.bride.nickname}
                      onChange={(e) => updateBride("nickname", e.target.value)}
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Lengkap &amp; Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.couple.bride.fullName}
                    onChange={(e) => updateBride("fullName", e.target.value)}
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Username Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={config.couple.bride.instagram}
                    onChange={(e) => updateBride("instagram", e.target.value)}
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wedding Date & Hashtag */}
          <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
            <div className="border-b border-[#F2ECE1] pb-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                03 / Tanggal Utama &amp; Tagar Pernikahan
              </p>
              <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                Waktu Hitung Mundur &amp; Tampilan Tanggal
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
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
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                />
              </div>

              <div>
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
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24] tabular-nums"
                />
              </div>

              <div>
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
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 font-mono text-xs text-[#1C2B24] tabular-nums"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                  Tagar / Hashtag *
                </label>
                <input
                  type="text"
                  required
                  placeholder="#ArkaFoundHisNadia"
                  value={config.couple.hashtag}
                  onChange={(e) => updateCoupleMeta("hashtag", e.target.value)}
                  className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
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
              className="rounded-sm border border-[#C5A059]/40 bg-white p-6"
            >
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Acara 0{idx + 1} ({event.id.toUpperCase()})
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  {event.title}
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                  <div>
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
                      className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24] tabular-nums"
                    />
                  </div>
                </div>

                <div>
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
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>

                <div>
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
                    className="w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1C2B24]"
                  />
                </div>

                <div>
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
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 font-mono text-xs text-[#1C2B24]"
                  />
                </div>

                <div>
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
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 font-mono text-xs text-[#1C2B24]"
                  />
                  <p className="mt-1 text-[11px] text-[#4A6358]">
                    Format cepat:{" "}
                    <code>
                      https://www.google.com/maps?q=Nama+Tempat&amp;output=embed
                    </code>
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Keterangan Busana / Dress Code
                  </label>
                  <input
                    type="text"
                    value={event.dressCode ?? ""}
                    onChange={(e) =>
                      updateEvent(idx, "dressCode", e.target.value)
                    }
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: KUTIPAN & AYAT */}
      {activeTab === "quote" && (
        <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
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
                className="w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-4 py-3 font-serif-luxury text-xl leading-loose text-[#1C2B24]"
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
                className="w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm leading-relaxed text-[#1C2B24]"
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
                className="min-h-11 w-full max-w-md rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKENING, QRIS & ALAMAT KADO */}
      {activeTab === "gifts" && (
        <div className="space-y-6">
          {/* Bank Accounts */}
          <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
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
                className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-[#C5A059]/50 bg-[#FAF7F2] px-3.5 py-2 text-xs font-semibold text-[#243830] transition-colors hover:bg-[#F2ECE1]"
              >
                <Plus className="h-3.5 w-3.5 text-[#8A6825]" />
                <span>Tambah Rekening</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {config.gifts.accounts.map((acc, idx) => (
                <div
                  key={acc.id}
                  className="space-y-3.5 rounded-sm border border-[#C5A059]/35 bg-[#FAF7F2]/60 p-4"
                >
                  <div className="flex items-center justify-between border-b border-[#C5A059]/25 pb-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Rekening #{idx + 1}
                    </span>
                    {config.gifts.accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBankAccount(idx)}
                        className="inline-flex items-center gap-1 rounded-sm border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <div>
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
                      className="min-h-10 w-full rounded-sm border border-[#C5A059]/45 bg-white px-3 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
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
                        className="min-h-10 w-full rounded-sm border border-[#C5A059]/45 bg-white px-3 py-2 font-mono text-sm text-[#1C2B24] tabular-nums"
                      />
                    </div>
                    <div>
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
                        className="min-h-10 w-full rounded-sm border border-[#C5A059]/45 bg-white px-3 py-2 text-sm text-[#1C2B24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                      Kantor Cabang (Opsional)
                    </label>
                    <input
                      type="text"
                      value={acc.branch ?? ""}
                      onChange={(e) =>
                        updateBankAccount(idx, "branch", e.target.value)
                      }
                      className="min-h-10 w-full rounded-sm border border-[#C5A059]/45 bg-white px-3 py-2 text-sm text-[#1C2B24]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QRIS & Physical Shipping Address */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Pembayaran QRIS
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Identitas Merchant QRIS
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nama Merchant QRIS *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.gifts.qris.merchantName}
                    onChange={(e) => updateQris("merchantName", e.target.value)}
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    Nomor NMID *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.gifts.qris.nmid}
                    onChange={(e) => updateQris("nmid", e.target.value)}
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 font-mono text-sm text-[#1C2B24] tabular-nums"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                    String Payload QRIS *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={config.gifts.qris.codePayload}
                    onChange={(e) => updateQris("codePayload", e.target.value)}
                    className="w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 font-mono text-xs text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
              <div className="border-b border-[#F2ECE1] pb-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
                  Kado Pernikahan Fisik
                </p>
                <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
                  Alamat Pengiriman Kado
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div>
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
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
                  />
                </div>

                <div>
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
                    className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 font-mono text-sm text-[#1C2B24] tabular-nums"
                  />
                </div>

                <div>
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
                    className="w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1C2B24]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MUSIK LATAR */}
      {activeTab === "audio" && (
        <div className="rounded-sm border border-[#C5A059]/40 bg-white p-6">
          <div className="border-b border-[#F2ECE1] pb-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6825]">
              Pengaturan Audio Undangan
            </p>
            <h2 className="mt-1 font-serif-luxury text-2xl font-semibold text-[#1C2B24]">
              Musik Latar Undangan
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                Judul Lagu *
              </label>
              <input
                type="text"
                required
                value={config.audio.title}
                onChange={(e) => updateAudio("title", e.target.value)}
                className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                Nama Artis / Ensemble *
              </label>
              <input
                type="text"
                required
                value={config.audio.artist}
                onChange={(e) => updateAudio("artist", e.target.value)}
                className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1C2B24]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#243830]">
                URL / Path File Audio MP3 *
              </label>
              <input
                type="text"
                required
                placeholder="/audio/wedding-theme.mp3"
                value={config.audio.src}
                onChange={(e) => updateAudio("src", e.target.value)}
                className="min-h-11 w-full rounded-sm border border-[#C5A059]/45 bg-[#FAF7F2] px-3.5 py-2 font-mono text-xs text-[#1C2B24]"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-[#4A6358]">
            Apabila file MP3 eksternal belum diunggah ke folder{" "}
            <code>public/audio/</code>, pemutar musik otomatis menggunakan
            sintesis melodi piano romantis bawaan tanpa memunculkan error pada
            peramban tamu.
          </p>
        </div>
      )}
    </form>
  );
}

