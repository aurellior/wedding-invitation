import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, sanitizePlainText } from "@/lib/security/rate-limit";
import {
  findGuestById,
  findGuestByName,
  getRsvps,
  upsertRsvp,
} from "@/lib/supabase/repository";
import { requireAdminAuth } from "@/lib/supabase/server";

const rsvpPayloadSchema = z.object({
  guest_id: z.string().trim().uuid().optional().nullable(),
  guest_name: z
    .string({ required_error: "Nama tamu wajib diisi." })
    .trim()
    .min(1, "Nama tamu tidak boleh kosong.")
    .max(120, "Nama tamu terlalu panjang."),
  attendance_status: z.enum(["hadir", "tidak_hadir", "ragu"], {
    errorMap: () => ({
      message: "Status kehadiran harus 'hadir', 'tidak_hadir', atau 'ragu'.",
    }),
  }),
  pax: z.coerce
    .number()
    .int("Jumlah kehadiran (pax) harus berupa bilangan bulat.")
    .min(0, "Jumlah kehadiran minimal 0.")
    .max(10, "Jumlah kehadiran maksimal 10."),
  notes: z
    .string()
    .trim()
    .max(300, "Catatan maksimal 300 karakter.")
    .optional()
    .nullable(),
  website: z.string().optional(), // Honeypot anti-bot field
});

export async function GET() {
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const data = await getRsvps();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/rsvp error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat data konfirmasi kehadiran.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, {
    namespace: "rsvp-submit",
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.allowed) {
    return rate.response;
  }

  try {
    const rawBody: unknown = await request.json();
    const parsed = rsvpPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Data RSVP tidak valid.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { guest_id, guest_name, attendance_status, pax, notes, website } =
      parsed.data;

    // Silent reject if bot filled the honeypot field
    if (website && website.trim().length > 0) {
      return NextResponse.json({
        data: null,
        message: "Konfirmasi kehadiran berhasil disimpan.",
      });
    }

    // Strict Invite-Only lookup: check guest_id first if provided, fallback to guest_name
    const matchedGuest =
      (guest_id ? await findGuestById(guest_id) : null) ??
      (await findGuestByName(guest_name));

    if (!matchedGuest) {
      return NextResponse.json(
        {
          error:
            "Maaf, fitur RSVP khusus untuk tamu yang terdaftar pada daftar undangan resmi.",
        },
        { status: 403 }
      );
    }

    // Prevent cross-guest IDOR when guest_id is supplied manually
    if (
      guest_id &&
      matchedGuest.name.trim().toLowerCase() !== guest_name.trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: "Identitas tamu tidak sesuai dengan tautan undangan.",
        },
        { status: 403 }
      );
    }

    const finalPax = attendance_status === "tidak_hadir" ? 0 : pax;

    if (attendance_status !== "tidak_hadir") {
      if (finalPax < 1) {
        return NextResponse.json(
          {
            error: "Jumlah tamu yang hadir minimal 1 orang.",
          },
          { status: 400 }
        );
      }

      if (finalPax > matchedGuest.max_pax) {
        return NextResponse.json(
          {
            error: `Jumlah kehadiran melebihi kuota undangan Anda (maksimal ${matchedGuest.max_pax} orang).`,
          },
          { status: 400 }
        );
      }
    }

    const sanitizedNotes = notes ? sanitizePlainText(notes) : null;

    const record = await upsertRsvp({
      guest_id: matchedGuest.id,
      guest_name: matchedGuest.name,
      attendance_status,
      pax: finalPax,
      notes: sanitizedNotes || null,
    });

    return NextResponse.json({
      data: record,
      message: "Konfirmasi kehadiran berhasil disimpan.",
    });
  } catch (error) {
    console.error("POST /api/rsvp error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat menyimpan konfirmasi kehadiran.",
      },
      { status: 500 }
    );
  }
}
