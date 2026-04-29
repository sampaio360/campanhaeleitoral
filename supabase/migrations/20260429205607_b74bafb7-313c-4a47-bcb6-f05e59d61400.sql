
-- 1. search_path em funções remanescentes
ALTER FUNCTION public.update_supporter_geolocation() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column()      SET search_path = public;
ALTER FUNCTION public.validate_pin(text)              SET search_path = public;

-- 2. Revogar EXECUTE de PUBLIC nas SECURITY DEFINER e liberar só para os roles certos
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'has_role','is_master','is_admin_of_campanha',
        'get_user_candidate_id','get_user_available_candidates',
        'get_unread_message_count','validate_pin'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.sig);
  END LOOP;
END$$;
