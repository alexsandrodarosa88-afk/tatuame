
ALTER TABLE public.tattoo_artists
  ADD COLUMN IF NOT EXISTS mp_preapproval_id text,
  ADD COLUMN IF NOT EXISTS plan_billing text;

CREATE OR REPLACE FUNCTION public.tattoo_artists_billing_unchanged(_old tattoo_artists, _new tattoo_artists)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    _old.asaas_customer_id IS NOT DISTINCT FROM _new.asaas_customer_id
    AND _old.asaas_subscription_id IS NOT DISTINCT FROM _new.asaas_subscription_id
    AND _old.subscription_status IS NOT DISTINCT FROM _new.subscription_status
    AND _old.subscription_billing_type IS NOT DISTINCT FROM _new.subscription_billing_type
    AND _old.subscription_next_due IS NOT DISTINCT FROM _new.subscription_next_due
    AND _old.subscription_started_at IS NOT DISTINCT FROM _new.subscription_started_at
    AND _old.is_lifetime_free IS NOT DISTINCT FROM _new.is_lifetime_free
    AND _old.is_active IS NOT DISTINCT FROM _new.is_active
    AND _old.plan_term_months IS NOT DISTINCT FROM _new.plan_term_months
    AND _old.plan_expires_at IS NOT DISTINCT FROM _new.plan_expires_at
    AND _old.mp_preapproval_id IS NOT DISTINCT FROM _new.mp_preapproval_id
    AND _old.plan_billing IS NOT DISTINCT FROM _new.plan_billing
    AND (
      _old.plan IS NOT DISTINCT FROM _new.plan
      OR (_old.plan = 'premium' AND _new.plan = 'free')
    );
$function$;

CREATE OR REPLACE FUNCTION public.record_premium_recurring_payment(
  _artist_id uuid,
  _mp_payment_id text,
  _amount numeric,
  _billing_type text DEFAULT NULL,
  _preapproval_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _ref_month date := date_trunc('month', now())::date;
  _existing_id uuid;
  _current_exp timestamptz;
  _new_exp timestamptz;
BEGIN
  -- já registrada? evita duplicidade
  SELECT id INTO _existing_id
    FROM public.artist_subscriptions
   WHERE asaas_payment_id = _mp_payment_id
   LIMIT 1;

  IF _existing_id IS NULL THEN
    INSERT INTO public.artist_subscriptions (
      artist_id, reference_month, amount, status, paid_at, due_date,
      asaas_payment_id, billing_type, term_months, notes
    ) VALUES (
      _artist_id, _ref_month, _amount, 'paid', now(),
      now()::date, _mp_payment_id, _billing_type, 1,
      'Cobrança recorrente Premium (MP preapproval)'
    );
  END IF;

  SELECT plan_expires_at INTO _current_exp
    FROM public.tattoo_artists
   WHERE id = _artist_id
   FOR UPDATE;

  _new_exp := GREATEST(COALESCE(_current_exp, now()), now()) + INTERVAL '1 month';

  UPDATE public.tattoo_artists
     SET plan = 'premium',
         plan_billing = 'recurring',
         plan_term_months = COALESCE(plan_term_months, 1),
         plan_expires_at = _new_exp,
         mp_preapproval_id = COALESCE(_preapproval_id, mp_preapproval_id),
         subscription_status = 'active',
         subscription_started_at = COALESCE(subscription_started_at, now()),
         subscription_next_due = _new_exp::date,
         updated_at = now()
   WHERE id = _artist_id;
END $function$;
