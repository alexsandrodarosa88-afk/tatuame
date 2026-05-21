
-- =========================================
-- TATTOO STYLES (admin-managed)
-- =========================================
CREATE TABLE public.tattoo_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tattoo_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active styles"
  ON public.tattoo_styles FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage styles"
  ON public.tattoo_styles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tattoo_styles_updated
  BEFORE UPDATE ON public.tattoo_styles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default styles
INSERT INTO public.tattoo_styles (name, sort_order) VALUES
  ('Old School', 10),
  ('New School', 20),
  ('Neo Traditional', 30),
  ('Realismo', 40),
  ('Realismo Colorido', 50),
  ('Fineline', 60),
  ('Micro Realismo', 70),
  ('Minimalista', 80),
  ('Geométrica', 90),
  ('Blackwork', 100),
  ('Blackout', 110),
  ('Oriental', 120),
  ('Sketch', 130),
  ('Trash', 140),
  ('Tribal', 150),
  ('Ornamental', 160),
  ('Māori', 170),
  ('Preto e Cinza', 180),
  ('Floral', 190);

-- =========================================
-- ARTIST APPLICATIONS (signup awaiting approval)
-- =========================================
CREATE TYPE public.artist_application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.artist_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  cpf text NOT NULL,
  status public.artist_application_status NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own application"
  ON public.artist_applications FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert own application"
  ON public.artist_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "users update own pending application"
  ON public.artist_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "admins manage applications"
  ON public.artist_applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_artist_applications_updated
  BEFORE UPDATE ON public.artist_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Approval function: creates tattoo_artists row linked to user
CREATE OR REPLACE FUNCTION public.approve_artist_application(_application_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Reuse existing artist row if user already has one, else create
  SELECT id INTO _artist_id FROM public.tattoo_artists WHERE user_id = _app.user_id LIMIT 1;
  IF _artist_id IS NULL THEN
    INSERT INTO public.tattoo_artists (user_id, name, address, is_active)
    VALUES (_app.user_id, _app.full_name, _app.address, false)
    RETURNING id INTO _artist_id;
  END IF;

  UPDATE public.artist_applications
    SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
    WHERE id = _application_id;

  RETURN _artist_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_artist_application(_application_id uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject applications';
  END IF;
  UPDATE public.artist_applications
    SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), notes = COALESCE(_reason, notes)
    WHERE id = _application_id AND status = 'pending';
  RETURN FOUND;
END; $$;

-- =========================================
-- ARTIST PAYOUTS (rateio)
-- =========================================
CREATE TYPE public.payout_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE public.artist_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.tattoo_artists(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  reference_period date NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artists see own payouts"
  ON public.artist_payouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tattoo_artists a
    WHERE a.id = artist_payouts.artist_id AND a.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage payouts"
  ON public.artist_payouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_artist_payouts_updated
  BEFORE UPDATE ON public.artist_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_artist_payouts_artist ON public.artist_payouts(artist_id);
CREATE INDEX idx_artist_payouts_status ON public.artist_payouts(status);
