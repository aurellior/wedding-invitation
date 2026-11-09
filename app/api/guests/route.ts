import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createGuest,
  deleteGuest,
  findGuestByName,
  getDashboardMetrics,
  getGuests,
  updateGuest,
} from "@/lib/supabase/repository";

const guestCategoryEnum = z.enum([
  "VIP",
  "Keluarga",
  "Sahabat",
  "Rekan Kerja",
  "Umum",
]);

const createGuestSchema = z.object({
  name: z
    .string({ required_error: "Nama tamu wajib diisi." })
    .trim()
    .min(2, "Nama tamu minimal 2 karakter.")
    .max(120, "Nama tamu maksimal 120 karakter."),
  category: guestCategoryEnum.default("Umum"),
  phone: z
    .string()
    .trim()
    .max(30, "Nomor telepon maksimal 30 karakter.")
    .optional()
    .default(""),
  max_pax: z.coerce
    .number()
    .int("Kuota pax harus bilangan bulat.")
    .min(1, "Kuota pax minimal 1 orang.")
    .max(10, "Kuota pax maksimal 10 orang.")
    .default(2),
});

const updateGuestSchema = z.object({
  id: z.string({ required_error: "ID tamu wajib diisi." }).trim().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  category: guestCategoryEnum.optional(),
  phone: z.string().trim().max(30).optional(),
  max_pax: z.coerce.number().int().min(1).max(10).optional(),
  invitation_sent: z.boolean().optional(),
});

export async function GET() {
  try {
    const [data, metrics] = await Promise.all([
      getGuests(),
      getDashboardMetrics(),
    ]);
    return NextResponse.json({ data, metrics });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat daftar tamu undangan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = createGuestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Data tamu tidak valid.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const existing = await findGuestByName(parsed.data.name);
    if (existing) {
      return NextResponse.json(
        {
          error: `Tamu dengan nama "${existing.name}" sudah terdaftar dalam daftar undangan.`,
        },
        { status: 409 }
      );
    }

    const guest = await createGuest({
      name: parsed.data.name,
      category: parsed.data.category,
      phone: parsed.data.phone,
      max_pax: parsed.data.max_pax,
    });

    return NextResponse.json({ data: guest }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menambahkan tamu undangan.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = updateGuestSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Data pembaruan tamu tidak valid.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, ...fields } = parsed.data;

    if (fields.name) {
      const duplicate = await findGuestByName(fields.name);
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          {
            error: `Nama tamu "${duplicate.name}" sudah digunakan oleh tamu lain.`,
          },
          { status: 409 }
        );
      }
    }

    const updated = await updateGuest(id, fields);
    if (!updated) {
      return NextResponse.json(
        { error: "Tamu tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui data tamu.",
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
        // Ignore empty JSON body
      }
    }

    if (!targetId) {
      return NextResponse.json(
        { error: "ID tamu wajib disertakan untuk penghapusan." },
        { status: 400 }
      );
    }

    const deleted = await deleteGuest(targetId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Data tamu tidak ditemukan." },
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
            : "Gagal menghapus data tamu.",
      },
      { status: 500 }
    );
  }
}
