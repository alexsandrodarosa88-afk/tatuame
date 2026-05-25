-- Recreate public view without security_invoker so it bypasses base table RLS
-- and exposes only safe marketing columns of active artists.
DROP VIEW IF EXISTS public.tattoo_artists_public;

CREATE VIEW public.tattoo_artists_public
WITH (security_invoker = false) AS
SELECT id, name, photo_url, bio, styles, city, state, address, instagram, whatsapp
FROM public.tattoo_artists
WHERE is_active = true;

GRANT SELECT ON public.tattoo_artists_public TO anon, authenticated;