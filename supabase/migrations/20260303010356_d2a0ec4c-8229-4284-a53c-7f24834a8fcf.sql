
-- Add latitude/longitude columns to streets table for geocoding
ALTER TABLE public.streets ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.streets ADD COLUMN IF NOT EXISTS longitude double precision;
