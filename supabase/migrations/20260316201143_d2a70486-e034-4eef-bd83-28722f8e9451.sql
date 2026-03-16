
DROP POLICY "Coordinators can send messages" ON public.team_messages;

CREATE POLICY "Coordinators can send messages" ON public.team_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'coordinator'::app_role)
    OR is_master(auth.uid())
  )
  AND (
    campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
    OR campanha_id IN (SELECT uc.campanha_id FROM user_campanhas uc WHERE uc.user_id = auth.uid())
    OR is_master(auth.uid())
  )
);
