
-- Function to distribute payouts for a completed campaign
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
BEGIN
  SELECT id, tattoo_value, price_per_quota, sold_quotas
    INTO _camp
    FROM public.campaigns
   WHERE id = _campaign_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Campaign not found'; END IF;

  -- Skip if payouts already distributed for this campaign
  SELECT count(*) INTO _existing FROM public.artist_payouts WHERE campaign_id = _campaign_id;
  IF _existing > 0 THEN RETURN 0; END IF;

  _gross := COALESCE(_camp.sold_quotas, 0) * COALESCE(_camp.price_per_quota, 0);
  _after_tattoo := _gross - COALESCE(_camp.tattoo_value, 0);

  IF _after_tattoo <= 0 THEN RETURN 0; END IF;

  _system_fee := round(_after_tattoo * 0.25, 2);
  _distributable := _after_tattoo - _system_fee;

  SELECT count(*) INTO _artist_count
    FROM public.tattoo_artists
   WHERE is_active = true;

  IF _artist_count = 0 OR _distributable <= 0 THEN RETURN 0; END IF;

  _per_artist := round(_distributable / _artist_count, 2);

  FOR _artist IN
    SELECT id FROM public.tattoo_artists WHERE is_active = true
  LOOP
    INSERT INTO public.artist_payouts (artist_id, campaign_id, amount, reference_period, status, notes)
    VALUES (
      _artist.id,
      _campaign_id,
      _per_artist,
      CURRENT_DATE,
      'pending'::public.payout_status,
      'Rateio automático da campanha'
    );
    _inserted := _inserted + 1;
  END LOOP;

  RETURN _inserted;
END;
$$;

-- Trigger: when campaign becomes 'completed', distribute payouts
CREATE OR REPLACE FUNCTION public.on_campaign_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'::public.campaign_status
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.distribute_campaign_payouts(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campaign_completed_payouts ON public.campaigns;
CREATE TRIGGER trg_campaign_completed_payouts
AFTER UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.on_campaign_completed();
