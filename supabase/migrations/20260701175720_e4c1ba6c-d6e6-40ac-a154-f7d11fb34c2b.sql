-- Add campaign_type: 'premium' (credit refund) or 'simple' (no credit)
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'premium'
    CHECK (campaign_type IN ('premium','simple'));

-- Rewrite confirm_paid_order so credits are only granted for premium items
CREATE OR REPLACE FUNCTION public.confirm_paid_order(_order_id uuid, _gateway_payment_id text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _order RECORD;
  _item RECORD;
  _claimed integer := 0;
  _credit_amount numeric := 0;
BEGIN
  SELECT id, user_id, status, total_amount
  INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _order.status = 'paid' THEN RETURN false; END IF;
  IF _order.status <> 'pending' THEN RETURN false; END IF;

  UPDATE public.orders
     SET status='paid', paid_at=now(),
         asaas_payment_id = COALESCE(_gateway_payment_id, asaas_payment_id),
         updated_at = now()
   WHERE id = _order.id AND status = 'pending';

  GET DIAGNOSTICS _claimed = ROW_COUNT;
  IF _claimed <> 1 THEN RETURN false; END IF;

  FOR _item IN
    SELECT oi.campaign_id, oi.quantity, oi.unit_price, c.campaign_type
      FROM public.order_items oi
      JOIN public.campaigns c ON c.id = oi.campaign_id
     WHERE oi.order_id = _order.id
  LOOP
    PERFORM public.allocate_lucky_numbers(_order.user_id, _item.campaign_id, _order.id, _item.quantity);
    IF _item.campaign_type = 'premium' THEN
      _credit_amount := _credit_amount + (_item.unit_price * _item.quantity);
    END IF;
  END LOOP;

  IF _credit_amount > 0 THEN
    INSERT INTO public.credits (user_id, amount, used_amount, source_order_id)
    VALUES (_order.user_id, _credit_amount, 0, _order.id);
  END IF;

  RETURN true;
END;
$function$;