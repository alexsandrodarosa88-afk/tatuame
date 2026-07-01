
-- Fix payout_requests SELECT: scope artist reads via artist_id, not user_id (which is the winner client)
DROP POLICY IF EXISTS "artists see own payout requests" ON public.payout_requests;
CREATE POLICY "artists see own payout requests"
ON public.payout_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.id = payout_requests.artist_id AND a.user_id = auth.uid()
  )
);

-- Fix service_terms: split ALL into scoped SELECT/INSERT/UPDATE/DELETE using artist_id
DROP POLICY IF EXISTS "artists manage own service terms" ON public.service_terms;

CREATE POLICY "artists select own service terms"
ON public.service_terms
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.id = service_terms.artist_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "artists insert own service terms"
ON public.service_terms
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.id = service_terms.artist_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "artists update own service terms"
ON public.service_terms
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.id = service_terms.artist_id AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.id = service_terms.artist_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "artists delete own service terms"
ON public.service_terms
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.id = service_terms.artist_id AND a.user_id = auth.uid()
  )
);
