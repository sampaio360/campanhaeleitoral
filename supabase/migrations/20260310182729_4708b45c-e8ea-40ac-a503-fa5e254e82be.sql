ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS genero text,
  ADD COLUMN IF NOT EXISTS escolaridade text;