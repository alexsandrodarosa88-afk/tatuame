
-- Add tattoo_artist role to enum if not present
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tattoo_artist';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tattoo_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  photo_url text,
  bio text,
  styles text[] NOT NULL DEFAULT '{}',
  city text,
  state text,
  address text,
  instagram text,
  whatsapp text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tattoo_artists_city ON public.tattoo_artists(city);
CREATE INDEX IF NOT EXISTS idx_tattoo_artists_state ON public.tattoo_artists(state);
CREATE INDEX IF NOT EXISTS idx_tattoo_artists_styles ON public.tattoo_artists USING GIN(styles);

ALTER TABLE public.tattoo_artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active artists" ON public.tattoo_artists
  FOR SELECT USING (is_active = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "artists update own profile" ON public.tattoo_artists
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage artists" ON public.tattoo_artists
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tattoo_artists_updated
  BEFORE UPDATE ON public.tattoo_artists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
