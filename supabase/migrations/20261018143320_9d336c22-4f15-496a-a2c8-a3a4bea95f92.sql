CREATE OR REPLACE FUNCTION public.guard_total_quotas() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE mx integer; cnt integer;
BEGIN
 IF NEW.total_quotas IS DISTINCT FROM OLD.total_quotas THEN
  SELECT COALESCE(max(number),0), count(*) INTO mx, cnt FROM public.lucky_numbers WHERE campaign_id=NEW.id;
  IF NEW.total_quotas < GREATEST(mx,cnt) THEN
   RAISE EXCEPTION 'Total de cotas não pode ser menor que %, pois já existem números vendidos até esse valor', GREATEST(mx,cnt);
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER campaigns_guard_quotas BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.guard_total_quotas();

CREATE OR REPLACE FUNCTION public.create_order(_campaign_id uuid, _quantity integer)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE c public.campaigns; oid uuid; used integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  IF _quantity < 1 OR _quantity > 500 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id AND status = 'ativa';
  IF NOT FOUND THEN RAISE EXCEPTION 'Campanha indisponível'; END IF;
  SELECT count(*) INTO used FROM public.lucky_numbers WHERE campaign_id=c.id;
  IF c.total_quotas - used < _quantity THEN RAISE EXCEPTION 'Restam apenas % cotas nesta campanha', GREATEST(c.total_quotas - used,0); END IF;
  INSERT INTO public.orders (user_id, campaign_id, quantity, total) VALUES (auth.uid(), c.id, _quantity, c.quota_price * _quantity) RETURNING id INTO oid;
  RETURN oid;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.guard_total_quotas() FROM PUBLIC, anon, authenticated;