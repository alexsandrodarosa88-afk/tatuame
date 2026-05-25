CREATE POLICY "site-assets public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');