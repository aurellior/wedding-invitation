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
import { requireAdminAuth } from "@/lib/supabase/server";

const guestCategoryEnum = z.enum([
  "Keluarga",
  "Sahabat",
  "Rekan Kerja",
  "Umum",
]);

const uuidSchema = z.string().trim().uuid("Format ID tamu tidak valid.");

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
  id: uuidSchema,
  name: z.string().trim().min(2).max(120).optional(),
  category: guestCategoryEnum.optional(),
  phone: z.string().trim().max(30).optional(),
  max_pax: z.coerce.number().int().min(1).max(10).optional(),
  invitation_sent: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const [data, metrics] = await Promise.all([
      getGuests(),
      getDashboardMetrics(),
    ]);
    return NextResponse.json({ data, metrics });
  } catch (error) {
    console.error("GET /api/guests error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat daftar tamu undangan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

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
    console.error("POST /api/guests error:", error);
    return NextResponse.json(
      {
        error: "Gagal menambahkan tamu undangan.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

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
    console.error("PATCH /api/guests error:", error);
    return NextResponse.json(
      {
        error: "Gagal memperbarui data tamu.",
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
        // Ignore empty JSON body
      }
    }

    const parsedId = uuidSchema.safeParse(targetId);
    if (!parsedId.success) {
      return NextResponse.json(
        { error: "ID tamu tidak valid atau wajib disertakan untuk penghapusan." },
        { status: 400 }
      );
    }

    const deleted = await deleteGuest(parsedId.data);
    if (!deleted) {
      return NextResponse.json(
        { error: "Data tamu tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/guests error:", error);
    return NextResponse.json(
      {
        error: "Gagal menghapus data tamu.",
      },
      { status: 500 }
    );
  }
}
