-- 1) Public marketing-only view for tattoo artists
DROP VIEW IF EXISTS public.tattoo_artists_public;
CREATE VIEW public.tattoo_artists_public
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  photo_url,
  bio,
  styles,
  city,
  state,
  address,
  instagram,
  whatsapp
FROM public.tattoo_artists
WHERE is_active = true;

GRANT SELECT ON public.tattoo_artists_public TO anon, authenticated;

-- 2) Tighten SELECT on tattoo_artists: owner + admin only.
-- Public listing must now use the view above.
DROP POLICY IF EXISTS "public read active artists" ON public.tattoo_artists;

CREATE POLICY "owners and admins read artists"
  ON public.tattoo_artists
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
