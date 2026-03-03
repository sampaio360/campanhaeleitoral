
-- 1. Drop the unique constraint that includes municipio_id
ALTER TABLE public.municipio_eleicoes DROP CONSTRAINT IF EXISTS municipio_eleicoes_municipio_id_eleicao_ano_cargo_key;

-- 2. Drop the municipio_id column (elections are campaign-level now)
ALTER TABLE public.municipio_eleicoes DROP COLUMN IF EXISTS municipio_id;

-- 3. Add new unique constraint: one election per campaign
ALTER TABLE public.municipio_eleicoes ADD CONSTRAINT municipio_eleicoes_campanha_ano_cargo_key UNIQUE(campanha_id, eleicao_ano, cargo);
