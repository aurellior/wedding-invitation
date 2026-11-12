-- Migration 003: Remove 'VIP' from guests.category constraint
-- Converts any existing 'VIP' guest records to 'Umum' and updates the CHECK constraint.

UPDATE public.guests
SET category = 'Umum'
WHERE category = 'VIP';

ALTER TABLE public.guests
  DROP CONSTRAINT IF EXISTS guests_category_check;

ALTER TABLE public.guests
  ADD CONSTRAINT guests_category_check
  CHECK (category IN ('Keluarga', 'Sahabat', 'Rekan Kerja', 'Umum'));

