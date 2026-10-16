ALTER TABLE public.artist_applications ADD COLUMN IF NOT EXISTS styles text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS styles text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.artist_applications ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.artist_applications ALTER COLUMN studio_address DROP NOT NULL;