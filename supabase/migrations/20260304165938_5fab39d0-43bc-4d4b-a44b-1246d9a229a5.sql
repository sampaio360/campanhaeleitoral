
-- Fix: Users read policy should also check user_campanhas and admin status
DROP POLICY IF EXISTS "Users read own campanha dashboard_widget_config" ON dashboard_widget_config;

CREATE POLICY "Users read own campanha dashboard_widget_config"
ON dashboard_widget_config
FOR SELECT
USING (
  (campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()))
  OR is_admin_of_campanha(auth.uid(), campanha_id)
  OR is_master(auth.uid())
);
