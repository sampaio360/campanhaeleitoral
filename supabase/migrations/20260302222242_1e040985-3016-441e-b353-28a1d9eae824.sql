
-- Allow admins, coordinators and masters to delete invite links from their campaign
CREATE POLICY "Admins can delete invite links"
ON public.invite_links
FOR DELETE
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coordinator'::app_role) OR is_master(auth.uid()))
  AND (
    campanha_id IN (SELECT profiles.campanha_id FROM profiles WHERE profiles.id = auth.uid())
    OR is_master(auth.uid())
  )
);
