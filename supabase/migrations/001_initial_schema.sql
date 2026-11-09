-- ============================================================================
-- Digital Wedding Invitation Platform & Admin Dashboard
-- Migration: 001_initial_schema.sql
-- Description: Schema for guests, rsvps (Strict Invite-Only), and wishes
--              with Row Level Security (RLS) and Supabase Realtime enabled.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLE: public.guests
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Umum' CHECK (category IN ('VIP', 'Keluarga', 'Sahabat', 'Rekan Kerja', 'Umum')),
  phone TEXT NOT NULL DEFAULT '',
  max_pax INT NOT NULL DEFAULT 2 CHECK (max_pax >= 1 AND max_pax <= 10),
  invitation_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS guests_name_normalized_uidx
  ON public.guests (LOWER(TRIM(name)));

CREATE INDEX IF NOT EXISTS guests_slug_idx
  ON public.guests (slug);

-- ----------------------------------------------------------------------------
-- 2. TABLE: public.rsvps (Strict Invite-Only linked 1:1 to public.guests)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Automatically update updated_at timestamp on RSVP update
CREATE OR REPLACE FUNCTION public.set_rsvp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rsvps_updated_at ON public.rsvps;
CREATE TRIGGER trg_rsvps_updated_at
  BEFORE UPDATE ON public.rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_rsvp_updated_at();

-- ----------------------------------------------------------------------------
-- 3. TABLE: public.wishes (Real-time Guestbook / Ucapan & Doa Restu)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  attendance_badge TEXT CHECK (attendance_badge IN ('hadir', 'tidak_hadir', 'ragu') OR attendance_badge IS NULL),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wishes_created_at_desc_idx
  ON public.wishes (created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- Guests Policies:
-- Public can read guest list to verify ?to= invitation & max_pax
DROP POLICY IF EXISTS "Public can view guests" ON public.guests;
CREATE POLICY "Public can view guests"
  ON public.guests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated admin & service role have full CRUD access to guests
DROP POLICY IF EXISTS "Admin full access on guests" ON public.guests;
CREATE POLICY "Admin full access on guests"
  ON public.guests
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- RSVPs Policies:
-- Public can read RSVPs
DROP POLICY IF EXISTS "Public can view rsvps" ON public.rsvps;
CREATE POLICY "Public can view rsvps"
  ON public.rsvps
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can insert RSVP only if linked to a valid registered guest_id
DROP POLICY IF EXISTS "Invited guests can insert rsvp" ON public.rsvps;
CREATE POLICY "Invited guests can insert rsvp"
  ON public.rsvps
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = guest_id
        AND pax <= g.max_pax
    )
  );

-- Public can update their existing RSVP only if linked to a valid registered guest_id
DROP POLICY IF EXISTS "Invited guests can update rsvp" ON public.rsvps;
CREATE POLICY "Invited guests can update rsvp"
  ON public.rsvps
  FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = guest_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.guests g
      WHERE g.id = guest_id
        AND pax <= g.max_pax
    )
  );

-- Authenticated admin & service role have full CRUD access to rsvps
DROP POLICY IF EXISTS "Admin full access on rsvps" ON public.rsvps;
CREATE POLICY "Admin full access on rsvps"
  ON public.rsvps
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Wishes Policies:
-- Public can read wishes
DROP POLICY IF EXISTS "Public can view wishes" ON public.wishes;
CREATE POLICY "Public can view wishes"
  ON public.wishes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can submit new wishes
DROP POLICY IF EXISTS "Public can insert wishes" ON public.wishes;
CREATE POLICY "Public can insert wishes"
  ON public.wishes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(trim(sender_name)) > 0 AND char_length(trim(message)) > 0);

-- Authenticated admin & service role have full CRUD access to wishes (including DELETE moderation)
DROP POLICY IF EXISTS "Admin full access on wishes" ON public.wishes;
CREATE POLICY "Admin full access on wishes"
  ON public.wishes
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. SUPABASE REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.wishes;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 6. OPTIONAL SEED DATA (Safe Idempotent Insert)
-- ----------------------------------------------------------------------------
INSERT INTO public.guests (id, name, slug, category, phone, max_pax, invitation_sent)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Budi Santoso', 'budi-santoso', 'Sahabat', '6281234567801', 2, true),
  ('11111111-1111-4111-8111-111111111102', 'Siti Nurhaliza', 'siti-nurhaliza', 'VIP', '6281234567802', 2, true),
  ('11111111-1111-4111-8111-111111111103', 'Dr. Andi Wijaya', 'dr-andi-wijaya', 'Keluarga', '6281234567803', 4, true),
  ('11111111-1111-4111-8111-111111111104', 'Keluarga Besar Bapak H. Ahmad', 'keluarga-besar-bapak-h-ahmad', 'Keluarga', '6281234567804', 5, true),
  ('11111111-1111-4111-8111-111111111105', 'Rina & Dimas', 'rina-dimas', 'Rekan Kerja', '6281234567805', 2, false),
  ('11111111-1111-4111-8111-111111111106', 'Dewi Lestari', 'dewi-lestari', 'Sahabat', '6281234567806', 2, false)
ON CONFLICT (LOWER(TRIM(name))) DO NOTHING;
