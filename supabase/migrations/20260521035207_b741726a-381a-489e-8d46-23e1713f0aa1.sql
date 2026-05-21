
-- Prevent duplicate lucky numbers within the same campaign (hard guarantee)
ALTER TABLE public.participations
  ADD CONSTRAINT participations_campaign_lucky_unique UNIQUE (campaign_id, lucky_number);

-- Storage bucket for tattoo artist photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tattoo-artists', 'tattoo-artists', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "tattoo artist photos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'tattoo-artists');

-- Authenticated users upload to their own folder (folder = auth.uid())
CREATE POLICY "tattoo artists upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tattoo-artists'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "tattoo artists update own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tattoo-artists'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "tattoo artists delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tattoo-artists'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can manage all photos in this bucket
CREATE POLICY "admins manage tattoo artist photos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'tattoo-artists' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'tattoo-artists' AND public.has_role(auth.uid(), 'admin'));
