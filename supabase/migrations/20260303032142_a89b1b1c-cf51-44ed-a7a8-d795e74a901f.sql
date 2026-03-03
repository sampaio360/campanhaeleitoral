
-- Create access_control table
CREATE TABLE public.access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  route text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, role, route)
);

-- Enable RLS
ALTER TABLE public.access_control ENABLE ROW LEVEL SECURITY;

-- Master full access
CREATE POLICY "Master full access access_control"
ON public.access_control
FOR ALL
TO authenticated
USING (is_master(auth.uid()))
WITH CHECK (is_master(auth.uid()));

-- Admin can manage for their campanhas
CREATE POLICY "Admin manage access_control"
ON public.access_control
FOR ALL
TO authenticated
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

-- Authenticated users can read access_control for their campanha (needed for enforcement)
CREATE POLICY "Users read own campanha access_control"
ON public.access_control
FOR SELECT
TO authenticated
USING (
  campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  OR is_master(auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_access_control_updated_at
BEFORE UPDATE ON public.access_control
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
