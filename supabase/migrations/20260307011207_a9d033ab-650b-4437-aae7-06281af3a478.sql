
ALTER TABLE public.team_messages 
  ADD COLUMN target_roles text[] DEFAULT '{}',
  ADD COLUMN target_cidade text DEFAULT NULL;

-- Update RLS: users should only see messages targeted at them
DROP POLICY IF EXISTS "Users read own campanha messages" ON public.team_messages;

CREATE POLICY "Users read own campanha messages"
ON public.team_messages
FOR SELECT
TO authenticated
USING (
  (
    (campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()))
    OR is_admin_of_campanha(auth.uid(), campanha_id)
    OR is_master(auth.uid())
  )
  AND (
    -- sender can always see their own messages
    sender_id = auth.uid()
    -- or no targeting = broadcast to all
    OR (
      (target_roles IS NULL OR target_roles = '{}')
      AND (target_cidade IS NULL OR target_cidade = '')
    )
    -- or user matches role target
    OR (
      (target_roles IS NOT NULL AND target_roles != '{}')
      AND EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role::text = ANY(target_roles)
      )
    )
    -- or user matches city target (via supporter link)
    OR (
      (target_cidade IS NOT NULL AND target_cidade != '')
      AND EXISTS (
        SELECT 1 FROM profiles p 
        JOIN supporters s ON s.id = p.supporter_id
        WHERE p.id = auth.uid() AND s.cidade = target_cidade
      )
    )
    -- coordinators/admins see all messages in their campaign
    OR has_role(auth.uid(), 'coordinator'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
