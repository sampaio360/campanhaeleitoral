
-- Drop all RESTRICTIVE update policies on profiles and recreate as PERMISSIVE

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Master can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their campaign" ON public.profiles;

-- Recreate as PERMISSIVE (default) so any ONE passing = allowed

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Master can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_master(auth.uid()));

CREATE POLICY "Admins can update profiles in their campaign"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    campanha_id IN (SELECT uc.campanha_id FROM user_campanhas uc WHERE uc.user_id = auth.uid())
    OR campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
    OR campanha_id IS NULL
  )
)
WITH CHECK (true);
