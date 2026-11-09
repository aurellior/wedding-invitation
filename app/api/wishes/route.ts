import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createWish,
  deleteWish,
  findGuestById,
  findGuestByName,
  getRsvpByGuestId,
  getWishes,
} from "@/lib/supabase/repository";

/**
 * Strips script blocks, HTML tags, inline event handlers, and dangerous URL protocols
 * to prevent Cross-Site Scripting (XSS) in guestbook wishes.
 */
function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(?:javascript|data|vbscript)\s*:/gi, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const createWishSchema = z.object({
  guest_id: z.string().trim().optional().nullable(),
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
});

export async function GET() {
  try {
    const data = await getWishes();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat daftar ucapan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const sanitizedSender = sanitizeText(parsed.data.sender_name);
    const sanitizedMessage = sanitizeText(parsed.data.message);

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

    const wishes = await getWishes();

    return NextResponse.json(
      {
        data: createdWish,
        wishes,
        message: "Terima kasih atas ucapan dan doa restu Anda.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan ucapan.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    if (!targetId) {
      return NextResponse.json(
        { error: "ID ucapan wajib disertakan untuk penghapusan." },
        { status: 400 }
      );
    }

    const deleted = await deleteWish(targetId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Data ucapan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghapus ucapan.",
      },
      { status: 500 }
    );
  }
}
