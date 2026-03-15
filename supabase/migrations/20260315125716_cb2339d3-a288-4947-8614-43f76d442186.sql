
-- Add target_user_ids to team_messages for individual targeting
ALTER TABLE public.team_messages 
ADD COLUMN target_user_ids uuid[] DEFAULT '{}'::uuid[];

-- Create push_subscriptions table for Web Push notifications
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  device_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage own subscriptions
CREATE POLICY "Users manage own push_subscriptions"
ON public.push_subscriptions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Master full access
CREATE POLICY "Master access push_subscriptions"
ON public.push_subscriptions FOR ALL TO authenticated
USING (is_master(auth.uid()));

-- Edge functions need to read subscriptions (service_role bypasses RLS)

-- Update RLS on team_messages to include target_user_ids visibility
DROP POLICY IF EXISTS "Users read own campanha messages" ON public.team_messages;

CREATE POLICY "Users read own campanha messages"
ON public.team_messages FOR SELECT TO authenticated
USING (
  (
    (campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid()))
    OR is_admin_of_campanha(auth.uid(), campanha_id)
    OR is_master(auth.uid())
  )
  AND (
    sender_id = auth.uid()
    OR (
      -- No targeting at all = everyone
      ((target_roles IS NULL) OR (target_roles = '{}'::text[]))
      AND ((target_cidade IS NULL) OR (target_cidade = ''::text))
      AND ((target_user_ids IS NULL) OR (target_user_ids = '{}'::uuid[]))
    )
    OR (
      -- Targeted by user_id
      (target_user_ids IS NOT NULL AND target_user_ids <> '{}'::uuid[] AND auth.uid() = ANY(target_user_ids))
    )
    OR (
      -- Targeted by role
      (target_roles IS NOT NULL AND target_roles <> '{}'::text[]
       AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND (ur.role)::text = ANY(target_roles)))
    )
    OR (
      -- Targeted by cidade
      (target_cidade IS NOT NULL AND target_cidade <> ''::text
       AND EXISTS (
         SELECT 1 FROM profiles p
         JOIN supporters s ON s.id = p.supporter_id
         WHERE p.id = auth.uid() AND s.cidade = target_cidade
       ))
    )
  )
);

-- Update get_unread_message_count to include target_user_ids
CREATE OR REPLACE FUNCTION public.get_unread_message_count(_user_id uuid, _campanha_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM team_messages tm
  WHERE tm.campanha_id = _campanha_id
    AND tm.sender_id <> _user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_reads mr
      WHERE mr.message_id = tm.id AND mr.user_id = _user_id
    )
    AND (
      -- No targeting = everyone
      (
        (tm.target_roles IS NULL OR tm.target_roles = '{}'::text[])
        AND (tm.target_cidade IS NULL OR tm.target_cidade = ''::text)
        AND (tm.target_user_ids IS NULL OR tm.target_user_ids = '{}'::uuid[])
      )
      OR (
        tm.target_user_ids IS NOT NULL AND tm.target_user_ids <> '{}'::uuid[]
        AND _user_id = ANY(tm.target_user_ids)
      )
      OR (
        tm.target_roles IS NOT NULL AND tm.target_roles <> '{}'::text[]
        AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = _user_id AND (ur.role)::text = ANY(tm.target_roles))
      )
      OR (
        tm.target_cidade IS NOT NULL AND tm.target_cidade <> ''::text
        AND EXISTS (
          SELECT 1 FROM profiles p
          JOIN supporters s ON s.id = p.supporter_id
          WHERE p.id = _user_id AND s.cidade = tm.target_cidade
        )
      )
    );
$$;
