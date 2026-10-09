CREATE TABLE public.artist_partner_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 3 AND 120),
 email text NOT NULL CHECK (char_length(email) <= 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 whatsapp text NOT NULL CHECK (whatsapp ~ '^([0-9]{10,11}|55[0-9]{10,11})$'),
 instagram text NOT NULL CHECK (instagram ~ '^[A-Za-z0-9_.]{1,30}$'),
 address text NOT NULL CHECK (char_length(address) BETWEEN 8 AND 300),
 postal_code text NOT NULL CHECK (postal_code ~ '^[0-9]{8}$'),
 city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 80),
 state text NOT NULL CHECK (state IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 styles text[] NOT NULL CHECK (cardinality(styles) BETWEEN 1 AND 30),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 notes text CHECK (char_length(notes) <= 1000),
 artist_id uuid REFERENCES public.tattoo_artists(id) ON DELETE SET NULL,
 reviewed_by uuid,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artist_partner_applications TO authenticated;
GRANT ALL ON public.artist_partner_applications TO service_role;
ALTER TABLE public.artist_partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read partner questionnaires" ON public.artist_partner_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX artist_partner_applications_status_created ON public.artist_partner_applications(status, created_at DESC);
CREATE OR REPLACE FUNCTION public.notify_admin_partner_application() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.admin_notifications(type,title,message,link,related_id) VALUES ('artist_application','Novo cadastro de tatuador',NEW.full_name || ' enviou um questionário para aprovação.','/admin/aplicacoes',NEW.id);
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_admin_partner_application() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_admin_partner_application AFTER INSERT ON public.artist_partner_applications FOR EACH ROW EXECUTE FUNCTION public.notify_admin_partner_application();
CREATE OR REPLACE FUNCTION public.review_partner_application(_application_id uuid, _approve boolean, _notes text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE app public.artist_partner_applications; new_artist_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 IF char_length(coalesce(_notes,'')) > 1000 THEN RAISE EXCEPTION 'Observação muito longa'; END IF;
 SELECT * INTO app FROM public.artist_partner_applications WHERE id = _application_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cadastro não encontrado'; END IF;
 IF app.status <> 'pending' THEN RETURN app.artist_id; END IF;
 IF _approve THEN
  INSERT INTO public.tattoo_artists(name, whatsapp, instagram, address, city, state, styles, is_active, plan)
  VALUES (app.full_name, CASE WHEN char_length(app.whatsapp) <= 11 THEN '55' || app.whatsapp ELSE app.whatsapp END, app.instagram, app.address || ' — CEP ' || app.postal_code, app.city, app.state, app.styles, true, 'free') RETURNING id INTO new_artist_id;
 END IF;
 UPDATE public.artist_partner_applications SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, notes = nullif(trim(_notes),''), reviewed_by = auth.uid(), reviewed_at = now(), artist_id = new_artist_id WHERE id = app.id;
 RETURN new_artist_id;
END;
$$;
REVOKE ALL ON FUNCTION public.review_partner_application(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_partner_application(uuid, boolean, text) TO authenticated, service_role;
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_partner_applications;