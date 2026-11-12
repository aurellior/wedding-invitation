import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { cache } from "react";
import { Pool } from "pg";
import { z } from "zod";
import type {
  AttendanceStatus,
  DashboardMetrics,
  Guest,
  GuestCategory,
  RsvpRecord,
  WishRecord,
} from "@/types/wedding";
import {
  DEFAULT_WEDDING_CONFIG,
  mergeWithDefaultConfig,
  type WeddingContentConfig,
} from "@/lib/config/wedding-config";
import { isSupabaseConfigured } from "./client";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "./server";

const uuidSchema = z.string().uuid();

async function getPrivilegedSupabaseClient() {
  return (
    createServiceRoleSupabaseClient() ?? (await createServerSupabaseClient())
  );
}

export { isSupabaseConfigured };

function getRawPostgresConnectionString(): string {
  return (
    process.env.SUPABASE_POSTGRES_URL?.trim() ||
    process.env.SUPABASE_POSTGRES_PRISMA_URL?.trim() ||
    process.env.SUPABASE_POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DATABASE_URL_POOLED?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    ""
  );
}

export function isPostgresConfigured(): boolean {
  const url = getRawPostgresConnectionString();
  return Boolean(
    url &&
      (url.startsWith("postgres://") || url.startsWith("postgresql://")) &&
      !url.includes("your-project")
  );
}

export function slugifyName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface LocalDatabaseSchema {
  guests: Guest[];
  rsvps: RsvpRecord[];
  wishes: WishRecord[];
  config?: WeddingContentConfig;
}

const INITIAL_SEED_DATA: LocalDatabaseSchema = {
  guests: [
    {
      id: "11111111-1111-4111-8111-111111111101",
      name: "Budi Santoso",
      slug: "budi-santoso",
      category: "Sahabat",
      phone: "6281234567801",
      max_pax: 2,
      invitation_sent: true,
      created_at: "2026-10-01T08:00:00.000Z",
    },
    {
      id: "11111111-1111-4111-8111-111111111102",
      name: "Siti Nurhaliza",
      slug: "siti-nurhaliza",
      category: "Keluarga",
      phone: "6281234567802",
      max_pax: 2,
      invitation_sent: true,
      created_at: "2026-10-01T08:05:00.000Z",
    },
    {
      id: "11111111-1111-4111-8111-111111111103",
      name: "Dr. Andi Wijaya",
      slug: "dr-andi-wijaya",
      category: "Keluarga",
      phone: "6281234567803",
      max_pax: 4,
      invitation_sent: true,
      created_at: "2026-10-01T08:10:00.000Z",
    },
    {
      id: "11111111-1111-4111-8111-111111111104",
      name: "Keluarga Besar Bapak H. Ahmad",
      slug: "keluarga-besar-bapak-h-ahmad",
      category: "Keluarga",
      phone: "6281234567804",
      max_pax: 5,
      invitation_sent: true,
      created_at: "2026-10-01T08:15:00.000Z",
    },
    {
      id: "11111111-1111-4111-8111-111111111105",
      name: "Rina & Dimas",
      slug: "rina-dimas",
      category: "Rekan Kerja",
      phone: "6281234567805",
      max_pax: 2,
      invitation_sent: false,
      created_at: "2026-10-01T08:20:00.000Z",
    },
    {
      id: "11111111-1111-4111-8111-111111111106",
      name: "Dewi Lestari",
      slug: "dewi-lestari",
      category: "Sahabat",
      phone: "6281234567806",
      max_pax: 2,
      invitation_sent: false,
      created_at: "2026-10-01T08:25:00.000Z",
    },
  ],
  rsvps: [
    {
      id: "22222222-2222-4222-8222-222222222201",
      guest_id: "11111111-1111-4111-8111-111111111101",
      guest_name: "Budi Santoso",
      attendance_status: "hadir",
      pax: 2,
      notes: "Siap hadir tepat waktu saat akad dan resepsi!",
      updated_at: "2026-10-02T10:00:00.000Z",
      created_at: "2026-10-02T10:00:00.000Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222202",
      guest_id: "11111111-1111-4111-8111-111111111102",
      guest_name: "Siti Nurhaliza",
      attendance_status: "hadir",
      pax: 2,
      notes: "InsyaAllah hadir bersama suami.",
      updated_at: "2026-10-02T11:30:00.000Z",
      created_at: "2026-10-02T11:30:00.000Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222203",
      guest_id: "11111111-1111-4111-8111-111111111103",
      guest_name: "Dr. Andi Wijaya",
      attendance_status: "hadir",
      pax: 4,
      notes: "Kami sekeluarga hadir di sesi resepsi siang.",
      updated_at: "2026-10-03T09:15:00.000Z",
      created_at: "2026-10-03T09:15:00.000Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222204",
      guest_id: "11111111-1111-4111-8111-111111111105",
      guest_name: "Rina & Dimas",
      attendance_status: "tidak_hadir",
      pax: 0,
      notes: "Mohon maaf sedang dinas di luar kota, doa terbaik untuk Arka & Nadia.",
      updated_at: "2026-10-03T14:20:00.000Z",
      created_at: "2026-10-03T14:20:00.000Z",
    },
  ],
  wishes: [
    {
      id: "33333333-3333-4333-8333-333333333301",
      guest_id: "11111111-1111-4111-8111-111111111101",
      sender_name: "Budi Santoso",
      message:
        "Selamat menempuh hidup baru Arka & Nadia! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah dan selalu diberkahi kebahagiaan.",
      attendance_badge: "hadir",
      created_at: "2026-10-02T10:02:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      guest_id: "11111111-1111-4111-8111-111111111102",
      sender_name: "Siti Nurhaliza",
      message:
        "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fii khair. Bahagia selalu untuk kedua mempelai yang sangat serasi.",
      attendance_badge: "hadir",
      created_at: "2026-10-02T11:35:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      guest_id: "11111111-1111-4111-8111-111111111103",
      sender_name: "Dr. Andi Wijaya & Keluarga",
      message:
        "Selamat berbahagia Arka dan dr. Nadia! Semoga ikatan suci ini menjadi awal perjalanan indah penuh cinta, pengertian, dan keberkahan.",
      attendance_badge: "hadir",
      created_at: "2026-10-03T09:20:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333304",
      guest_id: "11111111-1111-4111-8111-111111111104",
      sender_name: "Keluarga Besar Bapak H. Ahmad",
      message:
        "Turut bersyukur dan berbahagia atas pernikahan ananda Arka & Nadia. Semoga senantiasa rukun dan dikaruniai keturunan yang shalih dan shalihah.",
      attendance_badge: "hadir",
      created_at: "2026-10-03T12:10:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333305",
      guest_id: "11111111-1111-4111-8111-111111111105",
      sender_name: "Rina & Dimas",
      message:
        "Happy wedding Arka & Nadia! Walau belum bisa hadir langsung, doa terbaik kami selalu menyertai langkah baru kalian berdua.",
      attendance_badge: "tidak_hadir",
      created_at: "2026-10-03T14:25:00.000Z",
    },
  ],
};

// ============================================================================
// DIRECT POSTGRESQL POOL & AUTO-MIGRATION (VERCEL POSTGRES / PRISMA POSTGRES)
// ============================================================================

const globalForPg = globalThis as unknown as {
  __weddingPgPool?: Pool;
  __weddingPgInitPromise?: Promise<void>;
  __weddingLocalDb?: LocalDatabaseSchema;
};

function getPgPool(): Pool | null {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!globalForPg.__weddingPgPool) {
    let connectionString = getRawPostgresConnectionString();
    const useStrictSsl =
      Boolean(process.env.DATABASE_CA_CERT) ||
      process.env.POSTGRES_STRICT_SSL === "true";

    // pg v8+ treats ?sslmode=require as verify-full; strip sslmode when using relaxed SSL
    if (!useStrictSsl && connectionString) {
      try {
        const parsed = new URL(connectionString);
        parsed.searchParams.delete("sslmode");
        connectionString = parsed.toString();
      } catch {
        // Keep original string if URL parsing fails
      }
    }

    globalForPg.__weddingPgPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DATABASE_CA_CERT
        ? { ca: process.env.DATABASE_CA_CERT, rejectUnauthorized: true }
        : { rejectUnauthorized: process.env.POSTGRES_STRICT_SSL === "true" },
    });
  }

  return globalForPg.__weddingPgPool;
}

async function ensurePostgresSchema(forceInit = false): Promise<Pool | null> {
  const pool = getPgPool();
  if (!pool) {
    return null;
  }

  if (!forceInit) {
    return pool;
  }

  if (!globalForPg.__weddingPgInitPromise) {
    globalForPg.__weddingPgInitPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.guests (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'Umum' CHECK (category IN ('Keluarga', 'Sahabat', 'Rekan Kerja', 'Umum')),
          phone TEXT NOT NULL DEFAULT '',
          max_pax INT NOT NULL DEFAULT 2 CHECK (max_pax >= 1 AND max_pax <= 10),
          invitation_sent BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS guests_name_normalized_uidx
          ON public.guests (LOWER(TRIM(name)));
        CREATE UNIQUE INDEX IF NOT EXISTS guests_slug_uidx
          ON public.guests (slug);
        CREATE INDEX IF NOT EXISTS guests_created_at_desc_idx
          ON public.guests (created_at DESC);

        CREATE TABLE IF NOT EXISTS public.rsvps (
          id UUID PRIMARY KEY,
          guest_id UUID NOT NULL UNIQUE REFERENCES public.guests(id) ON DELETE CASCADE,
          guest_name TEXT NOT NULL,
          attendance_status TEXT NOT NULL CHECK (attendance_status IN ('hadir', 'tidak_hadir', 'ragu')),
          pax INT NOT NULL DEFAULT 1 CHECK (pax >= 0 AND pax <= 10),
          notes TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS rsvps_attendance_status_idx
          ON public.rsvps (attendance_status);
        CREATE INDEX IF NOT EXISTS rsvps_updated_at_desc_idx
          ON public.rsvps (updated_at DESC);

        CREATE TABLE IF NOT EXISTS public.wishes (
          id UUID PRIMARY KEY,
          guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
          sender_name TEXT NOT NULL,
          message TEXT NOT NULL,
          attendance_badge TEXT CHECK (attendance_badge IN ('hadir', 'tidak_hadir', 'ragu') OR attendance_badge IS NULL),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS wishes_created_at_desc_idx
          ON public.wishes (created_at DESC);

        CREATE TABLE IF NOT EXISTS public.wedding_settings (
          id TEXT PRIMARY KEY,
          config JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      const allowDemoSeed =
        process.env.NODE_ENV !== "production" ||
        process.env.ENABLE_DEMO_SEED === "true";

      if (allowDemoSeed) {
        const { rows } = await pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM public.guests`
        );
        const guestCount = Number(rows[0]?.count ?? "0");

        if (guestCount === 0) {
          for (const g of INITIAL_SEED_DATA.guests) {
            await pool.query(
              `INSERT INTO public.guests (id, name, slug, category, phone, max_pax, invitation_sent, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT DO NOTHING`,
              [
                g.id,
                g.name,
                g.slug,
                g.category,
                g.phone,
                g.max_pax,
                g.invitation_sent,
                g.created_at,
              ]
            );
          }
          for (const r of INITIAL_SEED_DATA.rsvps) {
            await pool.query(
              `INSERT INTO public.rsvps (id, guest_id, guest_name, attendance_status, pax, notes, updated_at, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (guest_id) DO NOTHING`,
              [
                r.id,
                r.guest_id,
                r.guest_name,
                r.attendance_status,
                r.pax,
                r.notes ?? null,
                r.updated_at,
                r.created_at,
              ]
            );
          }
          for (const w of INITIAL_SEED_DATA.wishes) {
            await pool.query(
              `INSERT INTO public.wishes (id, guest_id, sender_name, message, attendance_badge, created_at)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
              [
                w.id,
                w.guest_id ?? null,
                w.sender_name,
                w.message,
                w.attendance_badge ?? null,
                w.created_at,
              ]
            );
          }
        }
      }
    })().catch((err) => {
      console.error("Postgres schema init error:", err);
      globalForPg.__weddingPgInitPromise = undefined;
    });
  }

  await globalForPg.__weddingPgInitPromise;
  return pool;
}

function mapGuestRow(row: Record<string, unknown>): Guest {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category: (row.category as GuestCategory) || "Umum",
    phone: String(row.phone ?? ""),
    max_pax: Number(row.max_pax ?? 2),
    invitation_sent: Boolean(row.invitation_sent),
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

function mapRsvpRow(row: Record<string, unknown>): RsvpRecord {
  return {
    id: String(row.id),
    guest_id: String(row.guest_id),
    guest_name: String(row.guest_name),
    attendance_status: row.attendance_status as AttendanceStatus,
    pax: Number(row.pax ?? 0),
    notes: row.notes != null ? String(row.notes) : null,
    updated_at:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

function mapWishRow(row: Record<string, unknown>): WishRecord {
  return {
    id: String(row.id),
    guest_id: row.guest_id != null ? String(row.guest_id) : null,
    sender_name: String(row.sender_name),
    message: String(row.message),
    attendance_badge:
      row.attendance_badge != null
        ? (row.attendance_badge as AttendanceStatus)
        : null,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

// ============================================================================
// LOCAL JSON FALLBACK
// ============================================================================

const LOCAL_DB_FILE = path.join(process.cwd(), ".data", "local-db.json");

function cloneSeedData(): LocalDatabaseSchema {
  return {
    guests: INITIAL_SEED_DATA.guests.map((g) => ({ ...g })),
    rsvps: INITIAL_SEED_DATA.rsvps.map((r) => ({ ...r })),
    wishes: INITIAL_SEED_DATA.wishes.map((w) => ({ ...w })),
    config: structuredClone(DEFAULT_WEDDING_CONFIG),
  };
}

function readLocalDb(): LocalDatabaseSchema {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<LocalDatabaseSchema>;
      if (
        Array.isArray(parsed.guests) &&
        Array.isArray(parsed.rsvps) &&
        Array.isArray(parsed.wishes)
      ) {
        globalForPg.__weddingLocalDb = {
          guests: parsed.guests,
          rsvps: parsed.rsvps,
          wishes: parsed.wishes,
          config: mergeWithDefaultConfig(parsed.config),
        };
        return globalForPg.__weddingLocalDb;
      }
    }
  } catch {
    // Ignore file read errors in serverless/read-only environments
  }

  if (!globalForPg.__weddingLocalDb) {
    globalForPg.__weddingLocalDb = cloneSeedData();
    writeLocalDb(globalForPg.__weddingLocalDb);
  }

  return globalForPg.__weddingLocalDb;
}

function writeLocalDb(db: LocalDatabaseSchema): void {
  globalForPg.__weddingLocalDb = db;
  try {
    const dir = path.dirname(LOCAL_DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // Ignore file write errors in serverless/read-only environments
  }
}

// ============================================================================
// GUESTS REPOSITORY FUNCTIONS
// ============================================================================

export async function getGuests(): Promise<Guest[]> {
  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as Guest[];
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.guests ORDER BY created_at DESC`
      );
      return rows.map(mapGuestRow);
    } catch (err) {
      console.error("Postgres getGuests error:", err);
    }
  }

  const db = readLocalDb();
  return [...db.guests].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function findGuestByName(name: string): Promise<Guest | null> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 120) {
    return null;
  }

  const normalizedName = trimmed.toLowerCase();
  const normalizedSlug = slugifyName(trimmed);

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      // Parameterized separate queries prevent PostgREST filter injection in .or()
      const { data: bySlug, error: slugError } = await supabase
        .from("guests")
        .select("*")
        .eq("slug", normalizedSlug)
        .limit(1)
        .maybeSingle();

      if (!slugError && bySlug) {
        return bySlug as Guest;
      }

      const escapedLike = trimmed.replace(/[%_\\]/g, "\\$&");
      const { data: byName, error: nameError } = await supabase
        .from("guests")
        .select("*")
        .ilike("name", escapedLike)
        .limit(1)
        .maybeSingle();

      if (!nameError) {
        if (byName && byName.name.trim().toLowerCase() === normalizedName) {
          return byName as Guest;
        }
        if (!slugError) {
          return null;
        }
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.guests
         WHERE slug = $1 OR LOWER(TRIM(name)) = $2
         LIMIT 1`,
        [normalizedSlug, normalizedName]
      );
      if (rows[0]) {
        return mapGuestRow(rows[0]);
      }
    } catch (err) {
      console.error("Postgres findGuestByName error:", err);
    }
  }

  const db = readLocalDb();
  const found = db.guests.find(
    (g) =>
      g.slug === normalizedSlug ||
      g.name.trim().toLowerCase() === normalizedName
  );
  return found ?? null;
}

export async function findGuestById(id: string): Promise<Guest | null> {
  const parsedId = uuidSchema.safeParse(id.trim());
  if (!parsedId.success) {
    return null;
  }
  const validUuid = parsedId.data;

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("id", validUuid)
        .maybeSingle();

      if (!error) {
        return (data as Guest | null) ?? null;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.guests WHERE id = $1::uuid LIMIT 1`,
        [validUuid]
      );
      if (rows[0]) {
        return mapGuestRow(rows[0]);
      }
    } catch (err) {
      console.error("Postgres findGuestById error:", err);
    }
  }

  const db = readLocalDb();
  return db.guests.find((g) => g.id === validUuid) ?? null;
}

export async function createGuest(input: {
  name: string;
  category: GuestCategory;
  phone: string;
  max_pax: number;
}): Promise<Guest> {
  const cleanName = input.name.trim();
  const baseSlug = slugifyName(cleanName) || `guest-${Date.now()}`;
  const slug = baseSlug;
  const cleanPhone = input.phone.trim();

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("guests")
        .insert({
          name: cleanName,
          slug,
          category: input.category,
          phone: cleanPhone,
          max_pax: input.max_pax,
          invitation_sent: false,
        })
        .select("*")
        .single();

      if (!error && data) {
        return data as Guest;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const newId = randomUUID();
      const { rows } = await pool.query(
        `INSERT INTO public.guests (id, name, slug, category, phone, max_pax, invitation_sent)
         VALUES ($1, $2, $3, $4, $5, $6, false)
         RETURNING *`,
        [newId, cleanName, slug, input.category, cleanPhone, input.max_pax]
      );
      if (rows[0]) {
        return mapGuestRow(rows[0]);
      }
    } catch (err) {
      console.error("Postgres createGuest error:", err);
    }
  }

  const db = readLocalDb();
  const newGuest: Guest = {
    id: randomUUID(),
    name: cleanName,
    slug,
    category: input.category,
    phone: cleanPhone,
    max_pax: input.max_pax,
    invitation_sent: false,
    created_at: new Date().toISOString(),
  };

  db.guests.unshift(newGuest);
  writeLocalDb(db);
  return newGuest;
}

export async function updateGuest(
  id: string,
  input: Partial<
    Pick<Guest, "name" | "category" | "phone" | "max_pax" | "invitation_sent">
  >
): Promise<Guest | null> {
  const updates: Partial<Guest> = {};

  if (typeof input.name === "string" && input.name.trim()) {
    updates.name = input.name.trim();
    updates.slug = slugifyName(updates.name);
  }
  if (input.category !== undefined) {
    updates.category = input.category;
  }
  if (typeof input.phone === "string") {
    updates.phone = input.phone.trim();
  }
  if (typeof input.max_pax === "number") {
    updates.max_pax = input.max_pax;
  }
  if (typeof input.invitation_sent === "boolean") {
    updates.invitation_sent = input.invitation_sent;
  }

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("guests")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (!error && data) {
        if (updates.name) {
          await supabase
            .from("rsvps")
            .update({ guest_name: updates.name })
            .eq("guest_id", id);
        }
        return data as Guest;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const existing = await findGuestById(id);
      if (!existing) {
        return null;
      }
      const nextName = updates.name ?? existing.name;
      const nextSlug = updates.slug ?? existing.slug;
      const nextCategory = updates.category ?? existing.category;
      const nextPhone = updates.phone ?? existing.phone;
      const nextMaxPax = updates.max_pax ?? existing.max_pax;
      const nextSent = updates.invitation_sent ?? existing.invitation_sent;

      const { rows } = await pool.query(
        `UPDATE public.guests
         SET name = $1, slug = $2, category = $3, phone = $4, max_pax = $5, invitation_sent = $6
         WHERE id = $7::uuid
         RETURNING *`,
        [nextName, nextSlug, nextCategory, nextPhone, nextMaxPax, nextSent, id]
      );
      if (updates.name) {
        await pool.query(
          `UPDATE public.rsvps SET guest_name = $1 WHERE guest_id = $2::uuid`,
          [updates.name, id]
        );
      }
      if (rows[0]) {
        return mapGuestRow(rows[0]);
      }
    } catch (err) {
      console.error("Postgres updateGuest error:", err);
    }
  }

  const db = readLocalDb();
  const index = db.guests.findIndex((g) => g.id === id);
  if (index === -1) {
    return null;
  }

  const updatedGuest: Guest = {
    ...db.guests[index],
    ...updates,
  };
  db.guests[index] = updatedGuest;

  if (updates.name) {
    db.rsvps = db.rsvps.map((rsvp) =>
      rsvp.guest_id === id ? { ...rsvp, guest_name: updates.name! } : rsvp
    );
  }

  writeLocalDb(db);
  return updatedGuest;
}

export async function deleteGuest(id: string): Promise<boolean> {
  const parsedId = uuidSchema.safeParse(id.trim());
  if (!parsedId.success) {
    return false;
  }
  const validUuid = parsedId.data;

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", validUuid);
      if (!error) {
        return true;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const result = await pool.query(
        `DELETE FROM public.guests WHERE id = $1::uuid`,
        [validUuid]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("Postgres deleteGuest error:", err);
    }
  }

  const db = readLocalDb();
  const prevLen = db.guests.length;
  db.guests = db.guests.filter((g) => g.id !== validUuid);

  if (db.guests.length === prevLen) {
    return false;
  }

  db.rsvps = db.rsvps.filter((r) => r.guest_id !== validUuid);
  db.wishes = db.wishes.map((w) =>
    w.guest_id === validUuid ? { ...w, guest_id: null } : w
  );
  writeLocalDb(db);
  return true;
}

// ============================================================================
// RSVPS REPOSITORY FUNCTIONS
// ============================================================================

export async function getRsvps(): Promise<RsvpRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error && data) {
        return data as RsvpRecord[];
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.rsvps ORDER BY updated_at DESC`
      );
      return rows.map(mapRsvpRow);
    } catch (err) {
      console.error("Postgres getRsvps error:", err);
    }
  }

  const db = readLocalDb();
  return [...db.rsvps].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function getRsvpByGuestId(
  guestId: string
): Promise<RsvpRecord | null> {
  const parsedId = uuidSchema.safeParse(guestId.trim());
  if (!parsedId.success) {
    return null;
  }
  const validUuid = parsedId.data;

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("rsvps")
        .select("*")
        .eq("guest_id", validUuid)
        .maybeSingle();

      if (!error) {
        return (data as RsvpRecord | null) ?? null;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.rsvps WHERE guest_id = $1::uuid LIMIT 1`,
        [validUuid]
      );
      if (rows[0]) {
        return mapRsvpRow(rows[0]);
      }
    } catch (err) {
      console.error("Postgres getRsvpByGuestId error:", err);
    }
  }

  const db = readLocalDb();
  return db.rsvps.find((r) => r.guest_id === validUuid) ?? null;
}

export async function upsertRsvp(input: {
  guest_id: string;
  guest_name: string;
  attendance_status: AttendanceStatus;
  pax: number;
  notes?: string | null;
}): Promise<RsvpRecord> {
  const nowIso = new Date().toISOString();
  const normalizedPax =
    input.attendance_status === "tidak_hadir" ? 0 : input.pax;
  const cleanNotes = input.notes?.trim() ? input.notes.trim() : null;

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("rsvps")
        .upsert(
          {
            guest_id: input.guest_id,
            guest_name: input.guest_name,
            attendance_status: input.attendance_status,
            pax: normalizedPax,
            notes: cleanNotes,
            updated_at: nowIso,
          },
          { onConflict: "guest_id" }
        )
        .select("*")
        .single();

      if (!error && data) {
        return data as RsvpRecord;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const newId = randomUUID();
      const { rows } = await pool.query(
        `INSERT INTO public.rsvps (id, guest_id, guest_name, attendance_status, pax, notes, updated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
         ON CONFLICT (guest_id)
         DO UPDATE SET
           guest_name = EXCLUDED.guest_name,
           attendance_status = EXCLUDED.attendance_status,
           pax = EXCLUDED.pax,
           notes = EXCLUDED.notes,
           updated_at = EXCLUDED.updated_at
         RETURNING *`,
        [
          newId,
          input.guest_id,
          input.guest_name,
          input.attendance_status,
          normalizedPax,
          cleanNotes,
          nowIso,
        ]
      );
      if (rows[0]) {
        return mapRsvpRow(rows[0]);
      }
    } catch (err) {
      console.error("Postgres upsertRsvp error:", err);
    }
  }

  const db = readLocalDb();
  const existingIndex = db.rsvps.findIndex(
    (r) => r.guest_id === input.guest_id
  );

  if (existingIndex !== -1) {
    const updated: RsvpRecord = {
      ...db.rsvps[existingIndex],
      guest_name: input.guest_name,
      attendance_status: input.attendance_status,
      pax: normalizedPax,
      notes: cleanNotes,
      updated_at: nowIso,
    };
    db.rsvps[existingIndex] = updated;
    writeLocalDb(db);
    return updated;
  }

  const created: RsvpRecord = {
    id: randomUUID(),
    guest_id: input.guest_id,
    guest_name: input.guest_name,
    attendance_status: input.attendance_status,
    pax: normalizedPax,
    notes: cleanNotes,
    updated_at: nowIso,
    created_at: nowIso,
  };

  db.rsvps.unshift(created);
  writeLocalDb(db);
  return created;
}

// ============================================================================
// WISHES REPOSITORY FUNCTIONS
// ============================================================================

export async function getWishes(limit = 100): Promise<WishRecord[]> {
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("wishes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(safeLimit);

      if (!error && data) {
        return data as WishRecord[];
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM public.wishes ORDER BY created_at DESC LIMIT $1`,
        [safeLimit]
      );
      return rows.map(mapWishRow);
    } catch (err) {
      console.error("Postgres getWishes error:", err);
    }
  }

  const db = readLocalDb();
  return [...db.wishes]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, safeLimit);
}

export async function createWish(input: {
  guest_id?: string | null;
  sender_name: string;
  message: string;
  attendance_badge?: AttendanceStatus | null;
}): Promise<WishRecord> {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("wishes")
        .insert({
          guest_id: input.guest_id ?? null,
          sender_name: input.sender_name,
          message: input.message,
          attendance_badge: input.attendance_badge ?? null,
        })
        .select("*")
        .single();

      if (!error && data) {
        return data as WishRecord;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const newId = randomUUID();
      const { rows } = await pool.query(
        `INSERT INTO public.wishes (id, guest_id, sender_name, message, attendance_badge, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          newId,
          input.guest_id ?? null,
          input.sender_name,
          input.message,
          input.attendance_badge ?? null,
          nowIso,
        ]
      );
      if (rows[0]) {
        return mapWishRow(rows[0]);
      }
    } catch (err) {
      console.error("Postgres createWish error:", err);
    }
  }

  const db = readLocalDb();
  const newWish: WishRecord = {
    id: randomUUID(),
    guest_id: input.guest_id ?? null,
    sender_name: input.sender_name,
    message: input.message,
    attendance_badge: input.attendance_badge ?? null,
    created_at: nowIso,
  };

  db.wishes.unshift(newWish);
  writeLocalDb(db);
  return newWish;
}

export async function deleteWish(id: string): Promise<boolean> {
  const parsedId = uuidSchema.safeParse(id.trim());
  if (!parsedId.success) {
    return false;
  }
  const validUuid = parsedId.data;

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from("wishes")
        .delete()
        .eq("id", validUuid);
      if (!error) {
        return true;
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      const result = await pool.query(
        `DELETE FROM public.wishes WHERE id = $1::uuid`,
        [validUuid]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("Postgres deleteWish error:", err);
    }
  }

  const db = readLocalDb();
  const prevLen = db.wishes.length;
  db.wishes = db.wishes.filter((w) => w.id !== validUuid);
  if (db.wishes.length === prevLen) {
    return false;
  }

  writeLocalDb(db);
  return true;
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [guests, rsvps, wishes] = await Promise.all([
    getGuests(),
    getRsvps(),
    getWishes(),
  ]);

  const attendingRsvps = rsvps.filter((r) => r.attendance_status === "hadir");
  const declinedRsvps = rsvps.filter(
    (r) => r.attendance_status === "tidak_hadir"
  );

  const totalGuests = guests.length;
  const totalAttendingRsvps = attendingRsvps.length;
  const totalDeclinedRsvps = declinedRsvps.length;
  const totalPendingGuests = Math.max(
    0,
    totalGuests - totalAttendingRsvps - totalDeclinedRsvps
  );
  const estimatedPax = attendingRsvps.reduce(
    (sum, r) => sum + (Number.isFinite(r.pax) ? r.pax : 0),
    0
  );
  const totalWishes = wishes.length;

  return {
    totalGuests,
    totalAttendingRsvps,
    totalDeclinedRsvps,
    totalPendingGuests,
    estimatedPax,
    totalWishes,
  };
}

// ============================================================================
// WEDDING CONTENT SETTINGS REPOSITORY (CMS)
// ============================================================================

async function ensureWeddingSettingsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.wedding_settings (
      id TEXT PRIMARY KEY,
      config JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export const getWeddingConfig = cache(
  async (): Promise<WeddingContentConfig> => {
    if (isSupabaseConfigured()) {
      const supabase = await getPrivilegedSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("wedding_settings")
          .select("config")
          .eq("id", "default")
          .maybeSingle();

        if (!error) {
          return mergeWithDefaultConfig(
            (data?.config as Partial<WeddingContentConfig> | undefined) ??
              undefined
          );
        }
      }
    }

    const pool = await ensurePostgresSchema();
    if (pool) {
      try {
        const { rows } = await pool.query<{
          config: Partial<WeddingContentConfig>;
        }>(
          `SELECT config FROM public.wedding_settings WHERE id = 'default' LIMIT 1`
        );
        if (rows[0]?.config) {
          return mergeWithDefaultConfig(rows[0].config);
        }
      } catch {
        try {
          await ensureWeddingSettingsTable(pool);
        } catch (initErr) {
          console.error("Postgres ensureWeddingSettingsTable error:", initErr);
        }
      }
    }

    const db = readLocalDb();
    return mergeWithDefaultConfig(db.config);
  }
);

export async function updateWeddingConfig(
  nextConfig: Partial<WeddingContentConfig>
): Promise<WeddingContentConfig> {
  const merged = mergeWithDefaultConfig(nextConfig);
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = await getPrivilegedSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("wedding_settings")
        .upsert(
          {
            id: "default",
            config: merged,
            updated_at: nowIso,
          },
          { onConflict: "id" }
        )
        .select("config")
        .single();

      if (!error && data?.config) {
        return mergeWithDefaultConfig(
          data.config as Partial<WeddingContentConfig>
        );
      }
    }
  }

  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      await ensureWeddingSettingsTable(pool);
      const { rows } = await pool.query<{ config: Partial<WeddingContentConfig> }>(
        `INSERT INTO public.wedding_settings (id, config, updated_at)
         VALUES ('default', $1::jsonb, $2)
         ON CONFLICT (id)
         DO UPDATE SET config = EXCLUDED.config, updated_at = EXCLUDED.updated_at
         RETURNING config`,
        [JSON.stringify(merged), nowIso]
      );
      if (rows[0]?.config) {
        return mergeWithDefaultConfig(rows[0].config);
      }
    } catch (err) {
      console.error("Postgres updateWeddingConfig error:", err);
    }
  }

  const db = readLocalDb();
  db.config = merged;
  writeLocalDb(db);
  return merged;
}

// ============================================================================
// WEDDING CUSTOM MP3 AUDIO STORAGE (POSTGRES BYTEA + LOCAL FALLBACK)
// ============================================================================

export interface StoredWeddingAudio {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  updatedAt: string;
}

async function ensureWeddingAudioTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.wedding_audio (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      audio_data BYTEA NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.wedding_audio ENABLE ROW LEVEL SECURITY;
  `);
}

function getLocalAudioPath(): string {
  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "wedding-audio.json");
}

export async function saveWeddingAudioChunk(params: {
  fileName: string;
  mimeType: string;
  chunkBuffer: Buffer;
  chunkIndex: number;
  totalChunks: number;
}): Promise<void> {
  const { fileName, mimeType, chunkBuffer, chunkIndex } = params;
  const pool = await ensurePostgresSchema();

  if (pool) {
    await ensureWeddingAudioTable(pool);
    if (chunkIndex === 0) {
      await pool.query(
        `INSERT INTO public.wedding_audio (id, file_name, mime_type, audio_data, updated_at)
         VALUES ('default', $1, $2, $3, now())
         ON CONFLICT (id)
         DO UPDATE SET
           file_name = EXCLUDED.file_name,
           mime_type = EXCLUDED.mime_type,
           audio_data = EXCLUDED.audio_data,
           updated_at = now()`,
        [fileName, mimeType, chunkBuffer]
      );
    } else {
      await pool.query(
        `UPDATE public.wedding_audio
         SET audio_data = audio_data || $1,
             updated_at = now()
         WHERE id = 'default'`,
        [chunkBuffer]
      );
    }
    return;
  }

  // Local fallback when running offline without PostgreSQL
  const localPath = getLocalAudioPath();
  if (chunkIndex === 0 || !fs.existsSync(localPath)) {
    fs.writeFileSync(
      localPath,
      JSON.stringify({
        fileName,
        mimeType,
        base64: chunkBuffer.toString("base64"),
        updatedAt: new Date().toISOString(),
      }),
      "utf-8"
    );
  } else {
    const existing = JSON.parse(fs.readFileSync(localPath, "utf-8")) as {
      fileName: string;
      mimeType: string;
      base64: string;
    };
    const combined = Buffer.concat([
      Buffer.from(existing.base64, "base64"),
      chunkBuffer,
    ]);
    fs.writeFileSync(
      localPath,
      JSON.stringify({
        fileName,
        mimeType,
        base64: combined.toString("base64"),
        updatedAt: new Date().toISOString(),
      }),
      "utf-8"
    );
  }
}

export async function getWeddingAudio(): Promise<StoredWeddingAudio | null> {
  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      await ensureWeddingAudioTable(pool);
      const { rows } = await pool.query<{
        file_name: string;
        mime_type: string;
        audio_data: Buffer;
        updated_at: Date | string;
      }>(
        `SELECT file_name, mime_type, audio_data, updated_at
         FROM public.wedding_audio
         WHERE id = 'default'
         LIMIT 1`
      );
      if (rows[0] && rows[0].audio_data) {
        return {
          fileName: rows[0].file_name,
          mimeType: rows[0].mime_type || "audio/mpeg",
          buffer: Buffer.isBuffer(rows[0].audio_data)
            ? rows[0].audio_data
            : Buffer.from(rows[0].audio_data),
          updatedAt:
            rows[0].updated_at instanceof Date
              ? rows[0].updated_at.toISOString()
              : String(rows[0].updated_at),
        };
      }
    } catch (err) {
      console.error("Postgres getWeddingAudio error:", err);
    }
  }

  try {
    const localPath = getLocalAudioPath();
    if (fs.existsSync(localPath)) {
      const parsed = JSON.parse(fs.readFileSync(localPath, "utf-8")) as {
        fileName: string;
        mimeType: string;
        base64: string;
        updatedAt: string;
      };
      return {
        fileName: parsed.fileName,
        mimeType: parsed.mimeType || "audio/mpeg",
        buffer: Buffer.from(parsed.base64, "base64"),
        updatedAt: parsed.updatedAt,
      };
    }
  } catch {
    // Ignore local read error
  }

  return null;
}

export async function deleteWeddingAudio(): Promise<void> {
  const pool = await ensurePostgresSchema();
  if (pool) {
    try {
      await ensureWeddingAudioTable(pool);
      await pool.query(`DELETE FROM public.wedding_audio WHERE id = 'default'`);
    } catch (err) {
      console.error("Postgres deleteWeddingAudio error:", err);
    }
  }

  try {
    const localPath = getLocalAudioPath();
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch {
    // Ignore
  }
}


