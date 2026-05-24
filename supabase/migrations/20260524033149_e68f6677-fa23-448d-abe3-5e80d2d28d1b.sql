CREATE OR REPLACE FUNCTION public.confirm_paid_order(_order_id uuid, _gateway_payment_id text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order RECORD;
  _item RECORD;
  _claimed boolean := false;
BEGIN
  SELECT id, user_id, status, total_amount
  INTO _order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF _order.status = 'paid' THEN
    RETURN false;
  END IF;

  IF _order.status <> 'pending' THEN
    RETURN false;
  END IF;

  UPDATE public.orders
  SET
    status = 'paid',
    paid_at = now(),
    asaas_payment_id = COALESCE(_gateway_payment_id, asaas_payment_id),
    updated_at = now()
  WHERE id = _order.id
    AND status = 'pending';

  GET DIAGNOSTICS _claimed = ROW_COUNT;
  IF NOT _claimed THEN
    RETURN false;
  END IF;

  FOR _item IN
    SELECT campaign_id, quantity
    FROM public.order_items
    WHERE order_id = _order.id
  LOOP
    PERFORM public.allocate_lucky_numbers(
      _order.user_id,
      _item.campaign_id,
      _order.id,
      _item.quantity
    );
  END LOOP;

  INSERT INTO public.credits (user_id, amount, used_amount, source_order_id)
  VALUES (_order.user_id, _order.total_amount, 0, _order.id);

  RETURN true;
END;
$$;