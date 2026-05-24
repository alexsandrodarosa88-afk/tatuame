CREATE POLICY "tattoo-artists list own or admin"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'tattoo-artists'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);