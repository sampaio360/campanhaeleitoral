
-- ========== 1. INVITE LINKS ==========
DROP POLICY IF EXISTS "Anon can read invite by token" ON public.invite_links;

-- RPC pública para resolver convite via token (precisa conhecer o token)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE (
  id uuid,
  campanha_id uuid,
  expires_at timestamptz,
  used_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT il.id, il.campanha_id, il.expires_at, il.used_at
  FROM public.invite_links il
  WHERE il.token = _token
    AND il.used_at IS NULL
    AND (il.expires_at IS NULL OR il.expires_at > now())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO anon, authenticated;

-- Permitir que o usuário recém-cadastrado marque o convite como usado
CREATE POLICY "Authenticated can consume invite"
ON public.invite_links
FOR UPDATE
TO authenticated
USING (used_at IS NULL AND (expires_at IS NULL OR expires_at > now()))
WITH CHECK (used_by = auth.uid() AND used_at IS NOT NULL);

-- ========== 2. HABILITAR RLS EM TABELAS PÚBLICAS ==========
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;

-- ========== 3. VIEWS COM SECURITY INVOKER ==========
ALTER VIEW public.v_execucao_orcamentaria SET (security_invoker = true);
ALTER VIEW public.supporters_heatmap      SET (security_invoker = true);

-- ========== 4. STORAGE: BUCKET AVATARS COM OWNERSHIP ==========
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars"           ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars"           ON storage.objects;

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ========== 5. PROFILES: corrigir WITH CHECK = true ==========
DROP POLICY IF EXISTS "Admins can update profiles in their campaign" ON public.profiles;

CREATE POLICY "Admins can update profiles in their campaign"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    campanha_id IN (SELECT uc.campanha_id FROM user_campanhas uc WHERE uc.user_id = auth.uid())
    OR campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
    OR campanha_id IS NULL
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND (
    campanha_id IN (SELECT uc.campanha_id FROM user_campanhas uc WHERE uc.user_id = auth.uid())
    OR campanha_id IN (SELECT p.campanha_id FROM profiles p WHERE p.id = auth.uid())
    OR campanha_id IS NULL
  )
);
