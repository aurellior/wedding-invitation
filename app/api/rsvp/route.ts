import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  findGuestById,
  findGuestByName,
  getRsvps,
  upsertRsvp,
} from "@/lib/supabase/repository";

const rsvpPayloadSchema = z.object({
  guest_id: z.string().trim().optional().nullable(),
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
});

export async function GET() {
  try {
    const data = await getRsvps();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat data konfirmasi kehadiran.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { guest_id, guest_name, attendance_status, pax, notes } = parsed.data;

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

    const record = await upsertRsvp({
      guest_id: matchedGuest.id,
      guest_name: matchedGuest.name,
      attendance_status,
      pax: finalPax,
      notes: notes ?? null,
    });

    return NextResponse.json({
      data: record,
      message: "Konfirmasi kehadiran berhasil disimpan.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan konfirmasi kehadiran.",
      },
      { status: 500 }
    );
  }
}
