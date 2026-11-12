-- ============================================================================
-- Digital Wedding Invitation Platform & Admin Dashboard
-- Migration: 002_security_hardening.sql
-- Description: Hardens RLS policies to prevent public phone/guest-list leaks,
--              enforces unique slugs, adds performance indexes, and secures
--              public.wedding_audio with RLS.
-- ============================================================================

-- 1. Unique slug & performance indexes
DROP INDEX IF EXISTS public.guests_slug_idx;
CREATE UNIQUE INDEX IF NOT EXISTS guests_slug_uidx
  ON public.guests (slug);

CREATE INDEX IF NOT EXISTS guests_created_at_desc_idx
  ON public.guests (created_at DESC);

CREATE INDEX IF NOT EXISTS rsvps_updated_at_desc_idx
  ON public.rsvps (updated_at DESC);

-- 2. Revoke permissive public (anon) RLS policies on guests & rsvps
-- Guest lookup & RSVP submission are handled securely via Server Components & API routes.
DROP POLICY IF EXISTS "Public can view guests" ON public.guests;
DROP POLICY IF EXISTS "Public can view rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Invited guests can insert rsvp" ON public.rsvps;
DROP POLICY IF EXISTS "Invited guests can update rsvp" ON public.rsvps;

-- 3. Ensure wedding_audio table exists & has RLS enabled
CREATE TABLE IF NOT EXISTS public.wedding_audio (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  audio_data BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_audio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view wedding audio" ON public.wedding_audio;
CREATE POLICY "Public can view wedding audio"
  ON public.wedding_audio
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin full access on wedding audio" ON public.wedding_audio;
CREATE POLICY "Admin full access on wedding audio"
  ON public.wedding_audio
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

