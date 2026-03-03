
-- 1. Create user_access_control table
CREATE TABLE public.user_access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, user_id, route)
);

-- 2. Enable RLS
ALTER TABLE public.user_access_control ENABLE ROW LEVEL SECURITY;

-- 3. Master full access
CREATE POLICY "Master full access user_access_control"
  ON public.user_access_control
  FOR ALL
  TO authenticated
  USING (is_master(auth.uid()))
  WITH CHECK (is_master(auth.uid()));

-- 4. Admin manage for their campanhas
CREATE POLICY "Admin manage user_access_control"
  ON public.user_access_control
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

-- 5. Users can read their own overrides
CREATE POLICY "Users read own user_access_control"
  ON public.user_access_control
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_master(auth.uid()));
