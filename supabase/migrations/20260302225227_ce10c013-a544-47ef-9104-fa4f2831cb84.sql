
-- Fix invite_links: drop restrictive anon policy and recreate as permissive
DROP POLICY IF EXISTS "Anon can read invite by token" ON public.invite_links;
CREATE POLICY "Anon can read invite by token"
ON public.invite_links
FOR SELECT
TO anon, authenticated
USING ((used_at IS NULL) AND ((expires_at IS NULL) OR (expires_at > now())));

-- Fix external_form_config: drop restrictive anon policy and recreate as permissive
DROP POLICY IF EXISTS "Anon read external_form_config via invite" ON public.external_form_config;
CREATE POLICY "Anon read external_form_config via invite"
ON public.external_form_config
FOR SELECT
TO anon, authenticated
USING (enabled = true);

-- Allow anon to read campaign branding (name, logo, color) for external form
CREATE POLICY "Anon can read campanhas for external form"
ON public.campanhas
FOR SELECT
TO anon
USING (true);
