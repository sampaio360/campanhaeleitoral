
-- Table to track message reads
CREATE TABLE public.message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.team_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Users can read their own read records
CREATE POLICY "Users can view own reads"
  ON public.message_reads FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own reads
CREATE POLICY "Users can mark as read"
  ON public.message_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Master full access
CREATE POLICY "Master full access message_reads"
  ON public.message_reads FOR ALL
  USING (is_master(auth.uid()));

-- Create a view for unread count per user (messages in their campaign not sent by them and not yet read)
CREATE OR REPLACE FUNCTION public.get_unread_message_count(_user_id uuid, _campanha_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM team_messages tm
  WHERE tm.campanha_id = _campanha_id
    AND tm.sender_id != _user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_reads mr
      WHERE mr.message_id = tm.id AND mr.user_id = _user_id
    )
    AND (
      -- Broadcast (no targeting)
      ((tm.target_roles IS NULL OR tm.target_roles = '{}') AND (tm.target_cidade IS NULL OR tm.target_cidade = ''))
      -- Role match
      OR (tm.target_roles IS NOT NULL AND tm.target_roles != '{}' AND EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = _user_id AND ur.role::text = ANY(tm.target_roles)
      ))
      -- City match
      OR (tm.target_cidade IS NOT NULL AND tm.target_cidade != '' AND EXISTS (
        SELECT 1 FROM profiles p JOIN supporters s ON s.id = p.supporter_id
        WHERE p.id = _user_id AND s.cidade = tm.target_cidade
      ))
      -- Coordinators/admins see all
      OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = _user_id AND ur.role IN ('coordinator', 'admin'))
    )
$$;
