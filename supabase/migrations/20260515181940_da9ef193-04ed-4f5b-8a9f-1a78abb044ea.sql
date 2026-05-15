
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.campaign_status AS ENUM ('active', 'closed', 'drawn');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'expired', 'canceled');

-- ============= TIMESTAMPS HELPER =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  cpf TEXT UNIQUE,
  telefone TEXT,
  cidade TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users select own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============= AUTO-CREATE PROFILE & ROLE ON SIGNUP =============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, telefone, cpf, cidade)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nome_completo',
    NEW.raw_user_meta_data->>'telefone',
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'cidade'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= CAMPAIGNS =============
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tattoo_value NUMERIC(10,2) NOT NULL,
  price_per_quota NUMERIC(10,2) NOT NULL,
  total_quotas INTEGER NOT NULL,
  sold_quotas INTEGER NOT NULL DEFAULT 0,
  ends_at TIMESTAMPTZ NOT NULL,
  status campaign_status NOT NULL DEFAULT 'active',
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns public read" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "admins manage campaigns" ON public.campaigns FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CART ITEMS =============
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cart_items_updated BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= ORDERS =============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= ORDER ITEMS =============
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ============= PARTICIPATIONS =============
CREATE TABLE public.participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  lucky_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, lucky_number)
);
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own participations" ON public.participations FOR SELECT USING (auth.uid() = user_id);

-- ============= CREDITS =============
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  used_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  source_order_id UUID REFERENCES public.orders(id),
  valid_until TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '12 months'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own credits" ON public.credits FOR SELECT USING (auth.uid() = user_id);

-- ============= ATOMIC LUCKY NUMBER GENERATOR =============
-- Locks campaign row, picks lowest available number 1..total_quotas, increments sold_quotas
CREATE OR REPLACE FUNCTION public.allocate_lucky_numbers(
  _user_id UUID,
  _campaign_id UUID,
  _order_id UUID,
  _quantity INTEGER
) RETURNS INTEGER[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _camp RECORD;
  _result INTEGER[] := ARRAY[]::INTEGER[];
  _num INTEGER;
  _i INTEGER;
BEGIN
  SELECT id, total_quotas, sold_quotas INTO _camp
  FROM public.campaigns WHERE id = _campaign_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF _camp.sold_quotas + _quantity > _camp.total_quotas THEN
    RAISE EXCEPTION 'Not enough quotas available';
  END IF;

  FOR _i IN 1.._quantity LOOP
    SELECT n INTO _num FROM generate_series(1, _camp.total_quotas) n
    WHERE n NOT IN (SELECT lucky_number FROM public.participations WHERE campaign_id = _campaign_id)
      AND n != ALL(_result)
    ORDER BY random() LIMIT 1;

    IF _num IS NULL THEN RAISE EXCEPTION 'No available numbers'; END IF;

    INSERT INTO public.participations (user_id, campaign_id, order_id, lucky_number)
    VALUES (_user_id, _campaign_id, _order_id, _num);

    _result := array_append(_result, _num);
  END LOOP;

  UPDATE public.campaigns SET sold_quotas = sold_quotas + _quantity WHERE id = _campaign_id;
  RETURN _result;
END; $$;

-- ============= SEED CAMPAIGNS =============
INSERT INTO public.campaigns (tattoo_value, price_per_quota, total_quotas, sold_quotas, ends_at, title) VALUES
  (500,  5.00,  300, 218, now() + INTERVAL '36 hours',  'Tatuagem até R$500'),
  (1000, 15.50, 200, 142, now() + INTERVAL '60 hours',  'Tatuagem até R$1000'),
  (2000, 20.50, 300, 187, now() + INTERVAL '96 hours',  'Tatuagem até R$2000'),
  (3000, 30.50, 300, 95,  now() + INTERVAL '144 hours', 'Tatuagem até R$3000');
