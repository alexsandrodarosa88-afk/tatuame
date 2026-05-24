
-- 1) Colunas novas no tatuador
ALTER TABLE public.tattoo_artists
  ADD COLUMN IF NOT EXISTS is_lifetime_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz;

-- 2) Função: valor mensal do tatuador (promo 6 meses)
CREATE OR REPLACE FUNCTION public.compute_artist_monthly_fee(_artist_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _started timestamptz;
  _lifetime boolean;
BEGIN
  SELECT subscription_started_at, is_lifetime_free
    INTO _started, _lifetime
    FROM public.tattoo_artists
   WHERE id = _artist_id;

  IF _lifetime THEN RETURN 0; END IF;
  IF _started IS NULL THEN RETURN 39.90; END IF;
  IF _started > (now() - INTERVAL '6 months') THEN RETURN 39.90; END IF;
  RETURN 59.90;
END $$;

-- 3) Função: bloquear tatuadores com mensalidade > 5 dias atrasada
CREATE OR REPLACE FUNCTION public.block_overdue_artists()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.tattoo_artists a
     SET subscription_status = 'blocked', updated_at = now()
   WHERE a.is_lifetime_free = false
     AND a.subscription_status <> 'blocked'
     AND EXISTS (
       SELECT 1 FROM public.artist_subscriptions s
        WHERE s.artist_id = a.id
          AND s.status = 'pending'
          AND s.due_date IS NOT NULL
          AND s.due_date < (CURRENT_DATE - INTERVAL '5 days')
     );
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END $$;

-- 4) Função: admin desbloqueia tatuador (limpa pendências atrasadas e libera para gerar novo PIX)
CREATE OR REPLACE FUNCTION public.admin_unblock_artist(_artist_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unblock artists';
  END IF;

  -- Cancela faturas pendentes atrasadas para permitir gerar nova
  UPDATE public.artist_subscriptions
     SET status = 'canceled', notes = COALESCE(notes,'') || ' [desbloqueio admin ' || now()::text || ']'
   WHERE artist_id = _artist_id
     AND status = 'pending';

  UPDATE public.tattoo_artists
     SET subscription_status = 'pending', updated_at = now()
   WHERE id = _artist_id;

  RETURN true;
END $$;

-- 5) Marca o tatuador alexsandrodarosa88@gmail.com como vitalício gratuito
DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'alexsandrodarosa88@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    UPDATE public.tattoo_artists
       SET is_lifetime_free = true,
           subscription_status = 'active',
           updated_at = now()
     WHERE user_id = _uid;
  END IF;
END $$;
