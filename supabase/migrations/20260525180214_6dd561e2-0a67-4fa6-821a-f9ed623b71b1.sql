-- Restrictive policy: artists cannot modify their own billing/subscription columns
CREATE OR REPLACE FUNCTION public.tattoo_artists_billing_unchanged(_old public.tattoo_artists, _new public.tattoo_artists)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    _old.asaas_customer_id IS NOT DISTINCT FROM _new.asaas_customer_id
    AND _old.asaas_subscription_id IS NOT DISTINCT FROM _new.asaas_subscription_id
    AND _old.subscription_status IS NOT DISTINCT FROM _new.subscription_status
    AND _old.subscription_billing_type IS NOT DISTINCT FROM _new.subscription_billing_type
    AND _old.subscription_next_due IS NOT DISTINCT FROM _new.subscription_next_due
    AND _old.subscription_started_at IS NOT DISTINCT FROM _new.subscription_started_at
    AND _old.is_lifetime_free IS NOT DISTINCT FROM _new.is_lifetime_free
    AND _old.is_active IS NOT DISTINCT FROM _new.is_active;
$$;

DROP POLICY IF EXISTS "artists cannot change billing fields" ON public.tattoo_artists;

CREATE POLICY "artists cannot change billing fields"
ON public.tattoo_artists
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR auth.uid() = user_id
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    auth.uid() = user_id
    AND public.tattoo_artists_billing_unchanged(
      (SELECT t FROM public.tattoo_artists t WHERE t.id = tattoo_artists.id),
      tattoo_artists.*
    )
  )
);