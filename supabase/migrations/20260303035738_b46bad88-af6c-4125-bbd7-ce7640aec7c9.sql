
-- Drop the overly permissive anon read policy
DROP POLICY IF EXISTS "Anon can read campanhas for external form" ON public.campanhas;

-- Recreate it scoped to only enabled external form configs (anon role only)
CREATE POLICY "Anon can read campanhas for external form"
ON public.campanhas
FOR SELECT
TO anon
USING (
  id IN (
    SELECT efc.campanha_id FROM external_form_config efc WHERE efc.enabled = true
  )
);

-- Also ensure admins only see campanhas they are linked to (via user_campanhas or profiles)
DROP POLICY IF EXISTS "Admins can view managed campanhas" ON public.campanhas;
CREATE POLICY "Admins can view managed campanhas"
ON public.campanhas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    id IN (SELECT uc.campanha_id FROM user_campanhas uc WHERE uc.user_id = auth.uid())
    OR id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
  )
);
