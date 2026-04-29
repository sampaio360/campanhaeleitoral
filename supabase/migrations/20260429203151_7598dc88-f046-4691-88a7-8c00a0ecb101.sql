-- 1) Tabela de junção N:N
CREATE TABLE public.inteligencia_analise_campanhas (
  analise_id uuid NOT NULL,
  campanha_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (analise_id, campanha_id)
);

CREATE INDEX idx_iac_campanha ON public.inteligencia_analise_campanhas(campanha_id);
CREATE INDEX idx_iac_analise ON public.inteligencia_analise_campanhas(analise_id);

-- 2) Backfill: análises atuais mantêm sua campanha como vínculo
INSERT INTO public.inteligencia_analise_campanhas (analise_id, campanha_id)
SELECT id, campanha_id FROM public.inteligencia_analises WHERE campanha_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3) Remover coluna campanha_id (com policies dependentes)
DROP POLICY IF EXISTS "Master access all inteligencia_analises" ON public.inteligencia_analises;
DROP POLICY IF EXISTS "Users access own campanha inteligencia_analises" ON public.inteligencia_analises;

ALTER TABLE public.inteligencia_analises DROP COLUMN campanha_id;

-- 4) Cascade ao deletar análise
ALTER TABLE public.inteligencia_analise_campanhas
  ADD CONSTRAINT iac_analise_fk FOREIGN KEY (analise_id)
  REFERENCES public.inteligencia_analises(id) ON DELETE CASCADE;

-- 5) RLS na tabela de junção
ALTER TABLE public.inteligencia_analise_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master full access iac"
ON public.inteligencia_analise_campanhas
FOR ALL TO authenticated
USING (is_master(auth.uid()))
WITH CHECK (is_master(auth.uid()));

CREATE POLICY "Users read iac of own campanha"
ON public.inteligencia_analise_campanhas
FOR SELECT TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- 6) Novas RLS para inteligencia_analises
-- Master gerencia tudo
CREATE POLICY "Master full access inteligencia_analises"
ON public.inteligencia_analises
FOR ALL TO authenticated
USING (is_master(auth.uid()))
WITH CHECK (is_master(auth.uid()));

-- Usuários só leem se a análise está vinculada a uma campanha à qual pertencem
CREATE POLICY "Users read inteligencia_analises via vinculo"
ON public.inteligencia_analises
FOR SELECT TO authenticated
USING (
  is_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.inteligencia_analise_campanhas iac
    WHERE iac.analise_id = inteligencia_analises.id
      AND (
        iac.campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
        OR is_admin_of_campanha(auth.uid(), iac.campanha_id)
      )
  )
);

-- 7) Storage: restringir upload/edição de capas ao Master
DROP POLICY IF EXISTS "Authenticated upload inteligencia-capas" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update inteligencia-capas" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete inteligencia-capas" ON storage.objects;

CREATE POLICY "Master upload inteligencia-capas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'inteligencia-capas' AND is_master(auth.uid()));

CREATE POLICY "Master update inteligencia-capas"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'inteligencia-capas' AND is_master(auth.uid()));

CREATE POLICY "Master delete inteligencia-capas"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'inteligencia-capas' AND is_master(auth.uid()));