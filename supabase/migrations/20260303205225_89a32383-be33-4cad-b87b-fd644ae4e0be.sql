
-- Drop existing RESTRICTIVE policies on agenda_events
DROP POLICY IF EXISTS "Master access all agenda_events" ON public.agenda_events;
DROP POLICY IF EXISTS "Users access own campanha agenda_events" ON public.agenda_events;

-- Create PERMISSIVE policies instead
CREATE POLICY "Master access all agenda_events"
ON public.agenda_events
FOR ALL
TO authenticated
USING (is_master(auth.uid()))
WITH CHECK (is_master(auth.uid()));

CREATE POLICY "Users access own campanha agenda_events"
ON public.agenda_events
FOR ALL
TO authenticated
USING (
  campanha_id IN (
    SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  campanha_id IN (
    SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()
  )
);
