
CREATE TABLE IF NOT EXISTS public.artist_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.tattoo_artists(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(artist_id, reference_month)
);

CREATE INDEX IF NOT EXISTS idx_artist_subs_artist ON public.artist_subscriptions(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_subs_status ON public.artist_subscriptions(status);

ALTER TABLE public.artist_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage subscriptions" ON public.artist_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "artists see own subscriptions" ON public.artist_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_id AND a.user_id = auth.uid())
  );

CREATE TRIGGER trg_artist_subs_updated
  BEFORE UPDATE ON public.artist_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bootstrap: promote current user to admin only if no admin exists yet
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT count(*) INTO _existing FROM public.user_roles WHERE role = 'admin';
  IF _existing > 0 THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END; $$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
