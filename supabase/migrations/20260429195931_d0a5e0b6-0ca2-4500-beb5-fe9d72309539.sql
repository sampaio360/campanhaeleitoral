-- Tabela de análises do módulo Inteligência Eleitoral
CREATE TABLE public.inteligencia_analises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  url text NOT NULL,
  imagem_url text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inteligencia_analises_campanha ON public.inteligencia_analises(campanha_id);

ALTER TABLE public.inteligencia_analises ENABLE ROW LEVEL SECURITY;

-- Master: acesso total
CREATE POLICY "Master access all inteligencia_analises"
ON public.inteligencia_analises
AS PERMISSIVE
FOR ALL
TO authenticated
USING (is_master(auth.uid()))
WITH CHECK (is_master(auth.uid()));

-- Usuários da campanha
CREATE POLICY "Users access own campanha inteligencia_analises"
ON public.inteligencia_analises
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  (campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()))
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
)
WITH CHECK (
  (campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()))
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);

-- Trigger updated_at
CREATE TRIGGER update_inteligencia_analises_updated_at
BEFORE UPDATE ON public.inteligencia_analises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para capas
INSERT INTO storage.buckets (id, name, public)
VALUES ('inteligencia-capas', 'inteligencia-capas', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública das capas
CREATE POLICY "Public read inteligencia-capas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inteligencia-capas');

-- Upload por usuários autenticados
CREATE POLICY "Authenticated upload inteligencia-capas"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inteligencia-capas');

-- Update por usuários autenticados
CREATE POLICY "Authenticated update inteligencia-capas"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'inteligencia-capas');

-- Delete por usuários autenticados
CREATE POLICY "Authenticated delete inteligencia-capas"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'inteligencia-capas');
