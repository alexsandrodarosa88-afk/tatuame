
-- 1) Lock down SECURITY DEFINER functions: revoke from anon/public, grant to authenticated where user-callable
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Grant back to authenticated for functions that are intentionally called by signed-in users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_artist_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_artist_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unblock_artist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_artist_monthly_fee(uuid) TO authenticated;

-- 2) Remove broad SELECT (listing) on public site-assets bucket.
-- Files remain accessible via the public URL endpoint, but listing via the API is disabled.
DROP POLICY IF EXISTS "site-assets public read" ON storage.objects;
