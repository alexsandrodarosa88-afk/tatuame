DROP POLICY IF EXISTS "Public can view availability of published artists" ON public.artist_availability;
DROP VIEW IF EXISTS public.tattoo_artists_public;
CREATE VIEW public.tattoo_artists_public
WITH (security_invoker = false) AS
SELECT id, name, photo_url, bio, styles, city, state, address, instagram, whatsapp, booking_notes, created_at
FROM public.tattoo_artists
WHERE is_active = true;

GRANT SELECT ON public.tattoo_artists_public TO anon, authenticated;

CREATE POLICY "Public can view availability of published artists"
  ON public.artist_availability FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.tattoo_artists_public p WHERE p.id = artist_id));