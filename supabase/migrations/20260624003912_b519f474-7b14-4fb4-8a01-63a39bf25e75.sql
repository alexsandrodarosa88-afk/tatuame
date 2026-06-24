
-- ===== 1) Plan columns on tattoo_artists =====
ALTER TABLE public.tattoo_artists
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_term_months integer,
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

ALTER TABLE public.tattoo_artists
  DROP CONSTRAINT IF EXISTS tattoo_artists_plan_check;
ALTER TABLE public.tattoo_artists
  ADD CONSTRAINT tattoo_artists_plan_check CHECK (plan IN ('free','premium'));

-- Existing artists: anyone active or lifetime stays premium until their next due
UPDATE public.tattoo_artists
   SET plan = 'premium',
       plan_term_months = COALESCE(plan_term_months, 6),
       plan_expires_at = COALESCE(
         plan_expires_at,
         CASE
           WHEN is_lifetime_free THEN now() + INTERVAL '50 years'
           WHEN subscription_next_due IS NOT NULL THEN (subscription_next_due::timestamptz)
           ELSE now() + INTERVAL '30 days'
         END
       )
 WHERE (is_lifetime_free = true OR subscription_status = 'active')
   AND plan = 'free';

-- Allow artists themselves to flip plan to free (not premium) via the billing-unchanged guard
CREATE OR REPLACE FUNCTION public.tattoo_artists_billing_unchanged(_old tattoo_artists, _new tattoo_artists)
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
    AND _old.is_active IS NOT DISTINCT FROM _new.is_active
    AND _old.plan_term_months IS NOT DISTINCT FROM _new.plan_term_months
    AND _old.plan_expires_at IS NOT DISTINCT FROM _new.plan_expires_at
    -- artist CAN downgrade to 'free' but cannot upgrade to premium directly
    AND (
      _old.plan IS NOT DISTINCT FROM _new.plan
      OR (_old.plan = 'premium' AND _new.plan = 'free')
    );
$$;
GRANT EXECUTE ON FUNCTION public.tattoo_artists_billing_unchanged(tattoo_artists, tattoo_artists) TO authenticated, anon, service_role;

-- ===== 2) Term on artist_subscriptions =====
ALTER TABLE public.artist_subscriptions
  ADD COLUMN IF NOT EXISTS term_months integer NOT NULL DEFAULT 1;

-- ===== 3) Promotion tasks =====
CREATE TABLE IF NOT EXISTS public.artist_promotion_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.tattoo_artists(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('story','reel','post')),
  task_index integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected')),
  instagram_url text,
  notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, week_start, task_type, task_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_promotion_tasks TO authenticated;
GRANT ALL ON public.artist_promotion_tasks TO service_role;

ALTER TABLE public.artist_promotion_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artists manage own tasks" ON public.artist_promotion_tasks;
CREATE POLICY "artists manage own tasks" ON public.artist_promotion_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_promotion_tasks.artist_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_promotion_tasks.artist_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_promo_tasks_artist_week ON public.artist_promotion_tasks(artist_id, week_start);
CREATE INDEX IF NOT EXISTS idx_promo_tasks_status ON public.artist_promotion_tasks(status);

DROP TRIGGER IF EXISTS trg_promo_tasks_updated ON public.artist_promotion_tasks;
CREATE TRIGGER trg_promo_tasks_updated BEFORE UPDATE ON public.artist_promotion_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 4) Helper: ensure tasks exist for the artist's current week =====
CREATE OR REPLACE FUNCTION public.ensure_week_promotion_tasks(_artist_id uuid, _week_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE i integer;
BEGIN
  -- 8 stories
  FOR i IN 1..8 LOOP
    INSERT INTO public.artist_promotion_tasks (artist_id, week_start, task_type, task_index)
    VALUES (_artist_id, _week_start, 'story', i)
    ON CONFLICT DO NOTHING;
  END LOOP;
  -- 1 reel
  INSERT INTO public.artist_promotion_tasks (artist_id, week_start, task_type, task_index)
  VALUES (_artist_id, _week_start, 'reel', 1)
  ON CONFLICT DO NOTHING;
  -- 1 post
  INSERT INTO public.artist_promotion_tasks (artist_id, week_start, task_type, task_index)
  VALUES (_artist_id, _week_start, 'post', 1)
  ON CONFLICT DO NOTHING;
END $$;

GRANT EXECUTE ON FUNCTION public.ensure_week_promotion_tasks(uuid, date) TO authenticated, service_role;

-- ===== 5) Payout factor =====
CREATE OR REPLACE FUNCTION public.compute_artist_payout_factor(_artist_id uuid, _reference_period date)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _month_start date := date_trunc('month', _reference_period)::date;
  _month_end date := (date_trunc('month', _reference_period) + INTERVAL '1 month - 1 day')::date;
  _total integer;
  _approved integer;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'approved')
  INTO _total, _approved
  FROM public.artist_promotion_tasks
  WHERE artist_id = _artist_id
    AND week_start >= _month_start - INTERVAL '6 days'
    AND week_start <= _month_end;

  -- If no tasks exist for the period at all, the artist hasn't engaged → 0
  IF _total = 0 THEN RETURN 0; END IF;
  RETURN ROUND((_approved::numeric / _total::numeric), 4);
END $$;

GRANT EXECUTE ON FUNCTION public.compute_artist_payout_factor(uuid, date) TO authenticated, service_role;

-- ===== 6) New payout distribution: only Premium active, multiplied by factor =====
CREATE OR REPLACE FUNCTION public.distribute_campaign_payouts(_campaign_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _camp RECORD;
  _gross numeric;
  _after_tattoo numeric;
  _system_fee numeric;
  _distributable numeric;
  _artist_count integer;
  _per_artist numeric;
  _existing integer;
  _inserted integer := 0;
  _artist RECORD;
  _factor numeric;
  _amount numeric;
  _ref_period date := CURRENT_DATE;
BEGIN
  SELECT id, tattoo_value, price_per_quota, sold_quotas
    INTO _camp
    FROM public.campaigns
   WHERE id = _campaign_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Campaign not found'; END IF;

  SELECT count(*) INTO _existing FROM public.artist_payouts WHERE campaign_id = _campaign_id;
  IF _existing > 0 THEN RETURN 0; END IF;

  _gross := COALESCE(_camp.sold_quotas, 0) * COALESCE(_camp.price_per_quota, 0);
  _after_tattoo := _gross - COALESCE(_camp.tattoo_value, 0);
  IF _after_tattoo <= 0 THEN RETURN 0; END IF;

  _system_fee := round(_after_tattoo * 0.25, 2);
  _distributable := _after_tattoo - _system_fee;

  -- only Premium + active (subscription) + plan_expires_at in the future
  SELECT count(*) INTO _artist_count
    FROM public.tattoo_artists
   WHERE is_active = true
     AND plan = 'premium'
     AND (plan_expires_at IS NULL OR plan_expires_at > now());

  IF _artist_count = 0 OR _distributable <= 0 THEN RETURN 0; END IF;

  _per_artist := round(_distributable / _artist_count, 2);

  FOR _artist IN
    SELECT id FROM public.tattoo_artists
     WHERE is_active = true
       AND plan = 'premium'
       AND (plan_expires_at IS NULL OR plan_expires_at > now())
  LOOP
    _factor := public.compute_artist_payout_factor(_artist.id, _ref_period);
    _amount := round(_per_artist * _factor, 2);

    INSERT INTO public.artist_payouts (artist_id, campaign_id, amount, reference_period, status, notes)
    VALUES (
      _artist.id,
      _campaign_id,
      _amount,
      _ref_period,
      'pending'::public.payout_status,
      'Rateio Premium (fator divulgação ' || (_factor * 100)::text || '%)'
    );
    _inserted := _inserted + 1;
  END LOOP;

  RETURN _inserted;
END $$;

-- ===== 7) Admin helper: activate premium plan after admin marks paid or webhook confirms =====
CREATE OR REPLACE FUNCTION public.activate_premium_plan(_artist_id uuid, _term_months integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _current_exp timestamptz;
BEGIN
  IF _term_months NOT IN (6, 12) THEN
    RAISE EXCEPTION 'Term must be 6 or 12 months';
  END IF;

  SELECT plan_expires_at INTO _current_exp FROM public.tattoo_artists WHERE id = _artist_id FOR UPDATE;

  UPDATE public.tattoo_artists
     SET plan = 'premium',
         plan_term_months = _term_months,
         plan_expires_at = GREATEST(COALESCE(_current_exp, now()), now()) + (_term_months || ' months')::interval,
         subscription_status = 'active',
         subscription_started_at = COALESCE(subscription_started_at, now()),
         subscription_next_due = (GREATEST(COALESCE(_current_exp, now()), now()) + (_term_months || ' months')::interval)::date,
         updated_at = now()
   WHERE id = _artist_id;
END $$;

GRANT EXECUTE ON FUNCTION public.activate_premium_plan(uuid, integer) TO service_role;
