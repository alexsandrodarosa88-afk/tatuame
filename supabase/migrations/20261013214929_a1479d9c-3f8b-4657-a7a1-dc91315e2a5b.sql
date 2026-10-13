DO $test$
DECLARE cid uuid:=gen_random_uuid(); uid uuid:=gen_random_uuid(); o1 uuid; o2 uuid; o3 uuid; n integer;
BEGIN
 BEGIN
  INSERT INTO public.campaigns(id,title,status,quota_price,total_quotas) VALUES(cid,'Teste temporário transacional','ativa',3.5,5);
  INSERT INTO public.orders(user_id,campaign_id,quantity,total,mp_preference_id) VALUES(uid,cid,3,10.5,'transaction-test-1') RETURNING id INTO o1;
  INSERT INTO public.orders(user_id,campaign_id,quantity,total,mp_preference_id) VALUES(uid,cid,2,7,'transaction-test-2') RETURNING id INTO o2;
  BEGIN
   PERFORM public.apply_mercadopago_payment(o1,'transaction-payment-1',9,'approved');
   RAISE EXCEPTION USING ERRCODE='ZX002', MESSAGE='Incorrect amount accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  PERFORM public.apply_mercadopago_payment(o1,'transaction-payment-1',10.5,'approved');
  PERFORM public.apply_mercadopago_payment(o1,'transaction-payment-1',10.5,'approved');
  SELECT count(*) INTO n FROM public.lucky_numbers WHERE order_id=o1;
  IF n<>3 THEN RAISE EXCEPTION 'Expected three numbers including duplicate notification, got %',n; END IF;
  PERFORM public.apply_mercadopago_payment(o2,'transaction-payment-2',7,'approved');
  SELECT count(*) INTO n FROM public.lucky_numbers WHERE order_id=o2;
  IF n<>2 THEN RAISE EXCEPTION 'Expected two numbers, got %',n; END IF;
  SELECT count(DISTINCT number) INTO n FROM public.lucky_numbers WHERE campaign_id=cid;
  IF n<>5 THEN RAISE EXCEPTION 'Campaign numbers are not unique'; END IF;
  INSERT INTO public.orders(user_id,campaign_id,quantity,total,mp_preference_id) VALUES(uid,cid,1,3.5,'transaction-test-3') RETURNING id INTO o3;
  BEGIN
   PERFORM public.apply_mercadopago_payment(o3,'transaction-payment-3',3.5,'approved');
   RAISE EXCEPTION USING ERRCODE='ZX002', MESSAGE='Over-capacity payment accepted';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
  END;
  IF EXISTS(SELECT 1 FROM public.lucky_numbers WHERE order_id=o3) THEN RAISE EXCEPTION 'Failed payment generated numbers'; END IF;
  PERFORM public.apply_mercadopago_payment(o1,'transaction-payment-1',10.5,'refunded');
  IF EXISTS(SELECT 1 FROM public.lucky_numbers WHERE order_id=o1) THEN RAISE EXCEPTION 'Refund did not remove numbers'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.orders WHERE id=o1 AND status='cancelado') THEN RAISE EXCEPTION 'Refund did not cancel order'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZX001',MESSAGE='Tests passed; roll back temporary data';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN RAISE NOTICE 'PASS: quota counts, uniqueness, duplicate notification, wrong amount, capacity and refund; all temporary rows rolled back';
 END;
 IF EXISTS(SELECT 1 FROM public.campaigns WHERE id=cid) THEN RAISE EXCEPTION 'Temporary test data remained'; END IF;
END
$test$;