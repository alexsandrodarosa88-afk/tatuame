CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id, role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email text, nome_completo text, telefone text, cpf text, cidade text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile own or admin read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profile own update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profile own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profile admin delete" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, telefone, cpf, cidade)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nome_completo', NEW.raw_user_meta_data->>'telefone', NEW.raw_user_meta_data->>'cpf', NEW.raw_user_meta_data->>'cidade')
  ON CONFLICT (id) DO NOTHING;
  IF lower(NEW.email) = 'alexsandrodarosa88@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.campaigns (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, prize text, kind text NOT NULL DEFAULT 'simples', image_url text, quota_price numeric(10,2) NOT NULL DEFAULT 0, total_quotas integer NOT NULL DEFAULT 100, display_percent integer, status text NOT NULL DEFAULT 'rascunho', starts_at timestamptz, ends_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.campaigns TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated; GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public sees active campaigns" ON public.campaigns FOR SELECT TO anon, authenticated USING (status IN ('ativa','encerrada') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE, quantity integer NOT NULL, total numeric(10,2) NOT NULL, status text NOT NULL DEFAULT 'pendente', paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated; GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders own or admin read" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lucky_numbers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE, user_id uuid NOT NULL, number integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(campaign_id, number));
GRANT SELECT ON public.lucky_numbers TO authenticated; GRANT ALL ON public.lucky_numbers TO service_role;
ALTER TABLE public.lucky_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "numbers own or admin" ON public.lucky_numbers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- client creates a pending order safely
CREATE OR REPLACE FUNCTION public.create_order(_campaign_id uuid, _quantity integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.campaigns; oid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
  IF _quantity < 1 OR _quantity > 500 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = _campaign_id AND status = 'ativa';
  IF NOT FOUND THEN RAISE EXCEPTION 'Campanha indisponível'; END IF;
  INSERT INTO public.orders (user_id, campaign_id, quantity, total) VALUES (auth.uid(), c.id, _quantity, c.quota_price * _quantity) RETURNING id INTO oid;
  RETURN oid;
END; $$;
REVOKE ALL ON FUNCTION public.create_order(uuid, integer) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.create_order(uuid, integer) TO authenticated;

-- when order becomes paid, generate lucky numbers
CREATE OR REPLACE FUNCTION public.generate_lucky_numbers() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total int; n int; made int := 0; tries int := 0;
BEGIN
  IF NEW.status = 'pago' AND (OLD.status IS DISTINCT FROM 'pago') THEN
    NEW.paid_at := COALESCE(NEW.paid_at, now());
    SELECT total_quotas INTO total FROM public.campaigns WHERE id = NEW.campaign_id;
    WHILE made < NEW.quantity AND tries < NEW.quantity * 50 LOOP
      tries := tries + 1;
      n := 1 + floor(random() * GREATEST(total,1))::int;
      BEGIN
        INSERT INTO public.lucky_numbers (order_id, campaign_id, user_id, number) VALUES (NEW.id, NEW.campaign_id, NEW.user_id, n);
        made := made + 1;
      EXCEPTION WHEN unique_violation THEN NULL; END;
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER orders_paid BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_lucky_numbers();

CREATE OR REPLACE FUNCTION public.campaign_sold(_campaign_id uuid) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT COALESCE(SUM(quantity),0)::int FROM public.orders WHERE campaign_id = _campaign_id AND status = 'pago' $$;
GRANT EXECUTE ON FUNCTION public.campaign_sold(uuid) TO anon, authenticated;

CREATE TABLE public.artist_applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, instagram text NOT NULL, whatsapp text NOT NULL, email text NOT NULL, city text NOT NULL, state text NOT NULL, studio_address text NOT NULL, status text NOT NULL DEFAULT 'pendente', published boolean NOT NULL DEFAULT false, photo_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT INSERT ON public.artist_applications TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_applications TO authenticated; GRANT ALL ON public.artist_applications TO service_role;
ALTER TABLE public.artist_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can apply" ON public.artist_applications FOR INSERT TO anon, authenticated WITH CHECK (status = 'pendente' AND published = false AND length(full_name) BETWEEN 2 AND 120 AND length(studio_address) BETWEEN 5 AND 300);
CREATE POLICY "admins manage applications" ON public.artist_applications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER apps_updated BEFORE UPDATE ON public.artist_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.public_artists WITH (security_invoker = false) AS SELECT id, full_name, instagram, city, state, photo_url FROM public.artist_applications WHERE status = 'aprovado' AND published = true;
GRANT SELECT ON public.public_artists TO anon, authenticated;

CREATE TABLE public.site_settings (id integer PRIMARY KEY DEFAULT 1, data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT single_row CHECK (id = 1));
GRANT SELECT ON public.site_settings TO anon; GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated; GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.site_settings (id, data) VALUES (1, '{"hero_title":"Sua próxima tattoo pode sair por uma cota.","hero_subtitle":"Campanhas exclusivas com os melhores artistas do Brasil.","whatsapp":"","faq":[]}'::jsonb);

ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns, public.orders;