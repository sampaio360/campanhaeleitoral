
-- 1. Create parent table for elections (ano + cargo) per município
CREATE TABLE public.municipio_eleicoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  eleicao_ano integer NOT NULL,
  cargo text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(municipio_id, eleicao_ano, cargo)
);

ALTER TABLE public.municipio_eleicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master access all municipio_eleicoes"
  ON public.municipio_eleicoes FOR ALL
  USING (is_master(auth.uid()))
  WITH CHECK (is_master(auth.uid()));

CREATE POLICY "Users access own campanha municipio_eleicoes"
  ON public.municipio_eleicoes FOR ALL
  USING (campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()) OR is_master(auth.uid()))
  WITH CHECK (campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()) OR is_master(auth.uid()));

-- 2. Add eleicao_id FK to existing municipio_historico_votacao
ALTER TABLE public.municipio_historico_votacao
  ADD COLUMN eleicao_id uuid REFERENCES public.municipio_eleicoes(id) ON DELETE CASCADE;

-- 3. Migrate existing data: create eleicao records from existing historico rows
INSERT INTO public.municipio_eleicoes (municipio_id, campanha_id, eleicao_ano, cargo)
SELECT DISTINCT municipio_id, campanha_id, eleicao_ano, cargo
FROM public.municipio_historico_votacao
ON CONFLICT DO NOTHING;

-- 4. Link existing historico rows to their eleicao
UPDATE public.municipio_historico_votacao h
SET eleicao_id = e.id
FROM public.municipio_eleicoes e
WHERE h.municipio_id = e.municipio_id
  AND h.eleicao_ano = e.eleicao_ano
  AND h.cargo = e.cargo;
