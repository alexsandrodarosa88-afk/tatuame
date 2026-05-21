
-- ============ artist_bank_details ============
CREATE TABLE public.artist_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  cpf text NOT NULL,
  rg text NOT NULL,
  birth_date date NOT NULL,
  bank_name text NOT NULL,
  bank_agency text NOT NULL,
  bank_account text NOT NULL,
  pix_key text NOT NULL,
  is_locked boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artists see own bank details" ON public.artist_bank_details
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_bank_details.artist_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "artists insert own bank details" ON public.artist_bank_details
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_bank_details.artist_id AND a.user_id = auth.uid())
  );

CREATE POLICY "admins manage bank details" ON public.artist_bank_details
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_bank_details_updated_at
  BEFORE UPDATE ON public.artist_bank_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Block updates by non-admin once locked
CREATE OR REPLACE FUNCTION public.prevent_bank_details_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.is_locked AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Dados bancários bloqueados. Abra um chamado para o admin para alterar.';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_prevent_bank_details_update
  BEFORE UPDATE ON public.artist_bank_details
  FOR EACH ROW EXECUTE FUNCTION public.prevent_bank_details_update();

-- ============ withdrawal_requests ============
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  amount numeric NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artists see own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = withdrawal_requests.artist_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "artists create own withdrawals" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = withdrawal_requests.artist_id AND a.user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "admins manage withdrawals" ON public.withdrawal_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ admin_notifications ============
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  related_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage notifications" ON public.admin_notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notify admin on withdrawal request
CREATE OR REPLACE FUNCTION public.notify_admin_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _artist_name text;
BEGIN
  SELECT name INTO _artist_name FROM public.tattoo_artists WHERE id = NEW.artist_id;
  INSERT INTO public.admin_notifications (type, title, message, link, related_id)
  VALUES (
    'withdrawal_request',
    'Nova solicitação de saque',
    COALESCE(_artist_name, 'Tatuador') || ' solicitou saque de R$ ' || NEW.amount::text,
    '/admin/saques',
    NEW.id
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_admin_withdrawal
  AFTER INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_withdrawal();

-- Notify admin on artist application
CREATE OR REPLACE FUNCTION public.notify_admin_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, link, related_id)
  VALUES (
    'artist_application',
    'Novo cadastro de tatuador',
    NEW.full_name || ' enviou cadastro para aprovação',
    '/admin/aplicacoes',
    NEW.id
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_admin_application
  AFTER INSERT ON public.artist_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_application();

-- ============ artist_subscriptions: add due_date ============
ALTER TABLE public.artist_subscriptions
  ADD COLUMN IF NOT EXISTS due_date date;
