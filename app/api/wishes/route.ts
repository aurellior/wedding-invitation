import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, sanitizePlainText } from "@/lib/security/rate-limit";
import {
  createWish,
  deleteWish,
  findGuestById,
  findGuestByName,
  getRsvpByGuestId,
  getWishes,
} from "@/lib/supabase/repository";
import { requireAdminAuth } from "@/lib/supabase/server";

const uuidSchema = z.string().trim().uuid("Format ID ucapan tidak valid.");

const createWishSchema = z.object({
  guest_id: z.string().trim().uuid().optional().nullable(),
  sender_name: z
    .string({ required_error: "Nama pengirim wajib diisi." })
    .trim()
    .min(1, "Nama pengirim tidak boleh kosong.")
    .max(100, "Nama pengirim maksimal 100 karakter."),
  message: z
    .string({ required_error: "Ucapan & doa wajib diisi." })
    .trim()
    .min(2, "Ucapan terlalu singkat.")
    .max(500, "Ucapan maksimal 500 karakter."),
  attendance_badge: z
    .enum(["hadir", "tidak_hadir", "ragu"])
    .optional()
    .nullable(),
  website: z.string().optional(), // Honeypot anti-bot field
});

export async function GET() {
  try {
    const data = await getWishes(100);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/wishes error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat daftar ucapan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, {
    namespace: "wishes-submit",
    limit: 5,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return rate.response;
  }

  try {
    const rawBody: unknown = await request.json();
    const parsed = createWishSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Data ucapan tidak valid.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      return NextResponse.json(
        {
          data: null,
          message: "Terima kasih atas ucapan dan doa restu Anda.",
        },
        { status: 201 }
      );
    }

    const sanitizedSender = sanitizePlainText(parsed.data.sender_name);
    const sanitizedMessage = sanitizePlainText(parsed.data.message);

    if (!sanitizedSender || !sanitizedMessage) {
      return NextResponse.json(
        {
          error: "Nama pengirim dan isi ucapan tidak boleh berisi tag HTML kosong.",
        },
        { status: 400 }
      );
    }

    const matchedGuest =
      (parsed.data.guest_id
        ? await findGuestById(parsed.data.guest_id)
        : null) ?? (await findGuestByName(sanitizedSender));

    let badge = parsed.data.attendance_badge ?? null;
    if (!badge && matchedGuest) {
      const existingRsvp = await getRsvpByGuestId(matchedGuest.id);
      if (existingRsvp) {
        badge = existingRsvp.attendance_status;
      }
    }

    const createdWish = await createWish({
      guest_id: matchedGuest?.id ?? null,
      sender_name: sanitizedSender,
      message: sanitizedMessage,
      attendance_badge: badge,
    });

    return NextResponse.json(
      {
        data: createdWish,
        message: "Terima kasih atas ucapan dan doa restu Anda.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/wishes error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat menyimpan ucapan.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    let targetId = request.nextUrl.searchParams.get("id")?.trim() ?? "";

    if (!targetId) {
      try {
        const body = (await request.json()) as { id?: string };
        if (typeof body?.id === "string") {
          targetId = body.id.trim();
        }
      } catch {
        // Ignore JSON parse error when body is empty
      }
    }

    const parsedId = uuidSchema.safeParse(targetId);
    if (!parsedId.success) {
      return NextResponse.json(
        { error: "ID ucapan tidak valid atau wajib disertakan untuk penghapusan." },
        { status: 400 }
      );
    }

    const deleted = await deleteWish(parsedId.data);
    if (!deleted) {
      return NextResponse.json(
        { error: "Data ucapan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/wishes error:", error);
    return NextResponse.json(
      {
        error: "Gagal menghapus ucapan.",
      },
      { status: 500 }
    );
  }
}
