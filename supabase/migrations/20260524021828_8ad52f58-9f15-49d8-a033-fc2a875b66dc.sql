-- 1. admin_notifications: restrictive policy for non-admins (defense in depth)
CREATE POLICY "non admins cannot write notifications"
ON public.admin_notifications
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Storage: drop overly broad public SELECT policy (bucket still public via URL)
DROP POLICY IF EXISTS "tattoo artist photos public read" ON storage.objects;

-- 3. Storage: replace permissive write policies with artist-only versions
DROP POLICY IF EXISTS "tattoo artists upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "tattoo artists update own folder" ON storage.objects;
DROP POLICY IF EXISTS "tattoo artists delete own folder" ON storage.objects;

CREATE POLICY "tattoo artists upload own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tattoo-artists'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "tattoo artists update own folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tattoo-artists'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "tattoo artists delete own folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tattoo-artists'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.user_id = auth.uid()
  )
);

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from anon/public
-- has_role is needed by RLS — keep for authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_artist_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_artist_application(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_artist_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_artist_application(uuid, text) TO authenticated;

-- allocate_lucky_numbers is called server-side with service role only
REVOKE EXECUTE ON FUNCTION public.allocate_lucky_numbers(uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;

-- Trigger functions don't need to be callable directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_withdrawal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_application() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_bank_details_update() FROM PUBLIC, anon, authenticated;