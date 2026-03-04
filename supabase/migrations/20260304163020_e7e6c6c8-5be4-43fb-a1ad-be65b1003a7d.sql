
CREATE TABLE public.dashboard_widget_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  widget_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, widget_key)
);

ALTER TABLE public.dashboard_widget_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage dashboard_widget_config"
ON public.dashboard_widget_config FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    campanha_id IN (SELECT uc.campanha_id FROM user_campanhas uc WHERE uc.user_id = auth.uid())
    OR campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    campanha_id IN (SELECT uc.campanha_id FROM user_campanhas uc WHERE uc.user_id = auth.uid())
    OR campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  )
);

CREATE POLICY "Master full access dashboard_widget_config"
ON public.dashboard_widget_config FOR ALL TO authenticated
USING (is_master(auth.uid()))
WITH CHECK (is_master(auth.uid()));

CREATE POLICY "Users read own campanha dashboard_widget_config"
ON public.dashboard_widget_config FOR SELECT TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_master(auth.uid())
);
