import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  DEFAULT_WEDDING_CONFIG,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";
import {
  getWeddingConfig,
  updateWeddingConfig,
} from "@/lib/supabase/repository";
import { requireAdminAuth } from "@/lib/supabase/server";

const safeHttpsUrlSchema = z
  .string()
  .trim()
  .url("Format URL tidak valid.")
  .refine((val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Tautan wajib menggunakan protokol aman (https://).");

const safeGoogleMapsEmbedSchema = safeHttpsUrlSchema.refine((val) => {
  try {
    const parsed = new URL(val);
    return (
      parsed.hostname === "www.google.com" ||
      parsed.hostname === "maps.google.com"
    );
  } catch {
    return false;
  }
}, "URL Embed Google Maps harus berasal dari domain resmi google.com.");

const safeAudioSrcSchema = z
  .string()
  .trim()
  .refine(
    (val) =>
      val === "" ||
      val.startsWith("/api/audio") ||
      val.startsWith("https://"),
    "Sumber audio hanya boleh kosong, /api/audio, atau URL https://."
  );

const personSchema = z.object({
  nickname: z.string().trim().min(1, "Nama panggilan wajib diisi"),
  fullName: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  fatherName: z.string().trim().min(1, "Nama ayah wajib diisi"),
  motherName: z.string().trim().min(1, "Nama ibu wajib diisi"),
  childOrder: z.string().trim().min(1, "Urutan anak wajib diisi"),
  instagram: z.string().trim(),
});

const eventSchema = z.object({
  id: z.enum(["akad", "resepsi"]),
  title: z.string().trim().min(1, "Judul acara wajib diisi"),
  subtitle: z.string().trim().min(1, "Subjudul acara wajib diisi"),
  dateDisplay: z.string().trim().min(1, "Tanggal acara wajib diisi"),
  timeDisplay: z.string().trim().min(1, "Waktu acara wajib diisi"),
  startIso: z.string().trim().min(1),
  endIso: z.string().trim().min(1),
  venueName: z.string().trim().min(1, "Nama tempat/gedung wajib diisi"),
  venueAddress: z.string().trim().min(1, "Alamat lokasi wajib diisi"),
  googleMapsUrl: safeHttpsUrlSchema,
  googleMapsEmbedUrl: safeGoogleMapsEmbedSchema,
});

const bankAccountSchema = z.object({
  id: z.string().trim().min(1),
  bankName: z.string().trim().min(1, "Nama bank wajib diisi"),
  accountNumber: z.string().trim().min(1, "Nomor rekening wajib diisi"),
  accountHolder: z.string().trim().min(1, "Nama pemilik rekening wajib diisi"),
  branch: z.string().trim().optional(),
});

const weddingConfigSchema = z.object({
  couple: z.object({
    groom: personSchema,
    bride: personSchema,
    hashtag: z.string().trim().min(1),
    weddingDateIso: z.string().trim().min(1),
    weddingDateDisplay: z.string().trim().min(1),
    shortDate: z.string().trim().min(1),
  }),
  quote: z.object({
    arabic: z.string().trim().min(1),
    translation: z.string().trim().min(1),
    source: z.string().trim().min(1),
  }),
  events: z.array(eventSchema).min(1),
  gifts: z.object({
    accounts: z.array(bankAccountSchema).min(1),
  }),
  audio: z.object({
    title: z.string().trim(),
    artist: z.string().trim(),
    src: safeAudioSrcSchema,
  }),
  whatsappTemplate: z
    .string()
    .trim()
    .min(1, "Template pesan WhatsApp tidak boleh kosong")
    .default(DEFAULT_WEDDING_CONFIG.whatsappTemplate),
});

export async function GET() {
  try {
    const config = await getWeddingConfig();
    return NextResponse.json({ data: config }, { status: 200 });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Gagal memuat konfigurasi konten undangan." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as {
      resetToDefault?: boolean;
      config?: WeddingContentConfig;
    };

    if (body?.resetToDefault) {
      const saved = await updateWeddingConfig(DEFAULT_WEDDING_CONFIG);
      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/content");
      revalidatePath("/admin/guests");
      return NextResponse.json(
        {
          data: saved,
          message: "Konten undangan berhasil dikembalikan ke pengaturan awal.",
        },
        { status: 200 }
      );
    }

    const parsed = weddingConfigSchema.safeParse(body?.config ?? body);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ||
        "Data konten undangan tidak valid. Periksa kembali isian formulir.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const saved = await updateWeddingConfig(parsed.data);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/content");
    revalidatePath("/admin/guests");

    return NextResponse.json(
      {
        data: saved,
        message:
          "Perubahan konten undangan berhasil disimpan dan langsung aktif di halaman undangan.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan perubahan konten undangan." },
      { status: 500 }
    );
  }
}
