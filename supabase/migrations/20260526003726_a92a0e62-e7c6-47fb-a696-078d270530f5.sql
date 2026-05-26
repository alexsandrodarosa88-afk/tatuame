
-- 1) Add tracker column for the promotional free month
ALTER TABLE public.tattoo_artists
  ADD COLUMN IF NOT EXISTS free_month_granted_at timestamptz;

-- 2) Replace approve_artist_application to accept _grant_free_month
DROP FUNCTION IF EXISTS public.approve_artist_application(uuid);
DROP FUNCTION IF EXISTS public.approve_artist_application(uuid, boolean);

CREATE OR REPLACE FUNCTION public.approve_artist_application(
  _application_id uuid,
  _grant_free_month boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _app RECORD;
  _artist_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve applications';
  END IF;

  SELECT * INTO _app FROM public.artist_applications WHERE id = _application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  IF _app.status <> 'pending' THEN RAISE EXCEPTION 'Application already processed'; END IF;

  SELECT id INTO _artist_id FROM public.tattoo_artists WHERE user_id = _app.user_id LIMIT 1;
  IF _artist_id IS NULL THEN
    INSERT INTO public.tattoo_artists (user_id, name, address, is_active)
    VALUES (_app.user_id, _app.full_name, _app.address, false)
    RETURNING id INTO _artist_id;
  END IF;

  UPDATE public.artist_applications
    SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
    WHERE id = _application_id;

  IF _grant_free_month THEN
    UPDATE public.tattoo_artists
       SET subscription_status = 'active',
           subscription_started_at = COALESCE(subscription_started_at, now()),
           subscription_next_due = (CURRENT_DATE + INTERVAL '1 month')::date,
           free_month_granted_at = now(),
           updated_at = now()
     WHERE id = _artist_id;

    -- cancel any pending invoice so they don't see a "pay now" prompt
    UPDATE public.artist_subscriptions
       SET status = 'canceled',
           notes = COALESCE(notes,'') || ' [mês grátis concedido na aprovação]'
     WHERE artist_id = _artist_id
       AND status = 'pending';
  END IF;

  RETURN _artist_id;
END; $function$;

-- 3) New RPC: admin grants 1 free month to an existing artist by email
CREATE OR REPLACE FUNCTION public.admin_grant_free_month(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _artist_id uuid;
  _email_norm text := lower(trim(_email));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can grant free months';
  END IF;

  IF _email_norm IS NULL OR _email_norm = '' THEN
    RAISE EXCEPTION 'Email obrigatório';
  END IF;

  -- find user by auth.users.email
  SELECT id INTO _user_id FROM auth.users WHERE lower(email) = _email_norm LIMIT 1;

  IF _user_id IS NULL THEN
    -- fall back to artist_applications.email
    SELECT user_id INTO _user_id
      FROM public.artist_applications
     WHERE lower(email) = _email_norm
     ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado com este email';
  END IF;

  SELECT id INTO _artist_id FROM public.tattoo_artists WHERE user_id = _user_id LIMIT 1;
  IF _artist_id IS NULL THEN
    RAISE EXCEPTION 'Este usuário ainda não é um tatuador aprovado';
  END IF;

  UPDATE public.tattoo_artists
     SET subscription_status = 'active',
         subscription_started_at = COALESCE(subscription_started_at, now()),
         subscription_next_due = GREATEST(
            COALESCE(subscription_next_due, CURRENT_DATE),
            CURRENT_DATE
         ) + INTERVAL '1 month',
         free_month_granted_at = now(),
         updated_at = now()
   WHERE id = _artist_id;

  UPDATE public.artist_subscriptions
     SET status = 'canceled',
         notes = COALESCE(notes,'') || ' [mês grátis concedido pelo admin ' || now()::text || ']'
   WHERE artist_id = _artist_id
     AND status = 'pending';

  RETURN _artist_id;
END; $function$;
