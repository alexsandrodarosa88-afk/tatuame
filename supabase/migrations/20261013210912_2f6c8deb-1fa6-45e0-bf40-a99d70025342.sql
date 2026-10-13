CREATE OR REPLACE FUNCTION public.generate_lucky_numbers() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE total integer; existing integer;
BEGIN
 IF NEW.status='pago' AND OLD.status IS DISTINCT FROM 'pago' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.campaign_id::text,0));
  SELECT total_quotas INTO total FROM public.campaigns WHERE id=NEW.campaign_id;
  SELECT count(*) INTO existing FROM public.lucky_numbers WHERE campaign_id=NEW.campaign_id;
  IF total-existing < NEW.quantity THEN RAISE EXCEPTION 'Campanha sem números suficientes; entre em contato para estorno'; END IF;
  NEW.paid_at:=COALESCE(NEW.paid_at,now());
  INSERT INTO public.lucky_numbers(order_id,campaign_id,user_id,number)
  SELECT NEW.id,NEW.campaign_id,NEW.user_id,n FROM generate_series(1,total) n WHERE NOT EXISTS (SELECT 1 FROM public.lucky_numbers l WHERE l.campaign_id=NEW.campaign_id AND l.number=n) ORDER BY random() LIMIT NEW.quantity;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.generate_lucky_numbers() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.apply_mercadopago_payment(_order_id uuid,_payment_id text,_amount numeric,_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders;
BEGIN
 SELECT * INTO o FROM public.orders WHERE id=_order_id FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF o.mp_preference_id IS NULL OR round(o.total,2)<>round(_amount,2) THEN RAISE EXCEPTION 'Pagamento não corresponde ao pedido'; END IF;
 IF o.mp_payment_id IS NOT NULL AND o.mp_payment_id<>_payment_id THEN RETURN; END IF;
 IF _status='approved' AND o.status='pendente' THEN
  UPDATE public.orders SET mp_payment_id=_payment_id,mp_payment_status=_status,status='pago' WHERE id=o.id;
 ELSIF _status IN ('refunded','charged_back') AND o.mp_payment_id=_payment_id THEN
  UPDATE public.orders SET mp_payment_status=_status,status='cancelado' WHERE id=o.id;
  DELETE FROM public.lucky_numbers WHERE order_id=o.id;
 ELSIF o.status='pendente' THEN
  UPDATE public.orders SET mp_payment_status=_status WHERE id=o.id;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.apply_mercadopago_payment(uuid,text,numeric,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_mercadopago_payment(uuid,text,numeric,text) TO service_role;