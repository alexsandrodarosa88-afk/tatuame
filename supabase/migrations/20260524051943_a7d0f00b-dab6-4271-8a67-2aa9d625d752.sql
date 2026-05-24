CREATE POLICY "site-assets admin read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));