
-- Table to store which fields are visible in the external registration form per campaign
CREATE TABLE public.external_form_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  fields jsonb NOT NULL DEFAULT '{"nome": true, "telefone": true, "email": true, "cpf": false, "endereco": false, "bairro": true, "cidade": true, "estado": false, "cep": false, "funcao_politica": false, "foto": false}'::jsonb,
  titulo text DEFAULT 'Cadastro de Apoiador',
  mensagem_sucesso text DEFAULT 'Cadastro realizado com sucesso! Obrigado pelo seu apoio.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.external_form_config ENABLE ROW LEVEL SECURITY;

-- Master and admin can manage config
CREATE POLICY "Master manage external_form_config"
ON public.external_form_config FOR ALL TO authenticated
USING (is_master(auth.uid()))
WITH CHECK (is_master(auth.uid()));

CREATE POLICY "Admin manage external_form_config"
ON public.external_form_config FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anon can read config (to render form)
CREATE POLICY "Anon read external_form_config via invite"
ON public.external_form_config FOR SELECT TO anon
USING (enabled = true);

-- Allow anon to insert supporters when submitting the external form
CREATE POLICY "Anon insert supporters via external form"
ON public.supporters FOR INSERT TO anon
WITH CHECK (
  campanha_id IN (
    SELECT il.campanha_id FROM invite_links il
    WHERE il.used_at IS NULL
    AND (il.expires_at IS NULL OR il.expires_at > now())
  )
  AND campanha_id IN (
    SELECT efc.campanha_id FROM external_form_config efc
    WHERE efc.enabled = true
  )
);
