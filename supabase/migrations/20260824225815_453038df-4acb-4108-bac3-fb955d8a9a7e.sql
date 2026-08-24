CREATE TABLE public.artist_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.tattoo_artists(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_artist_availability_artist ON public.artist_availability(artist_id, weekday, start_time);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_availability TO authenticated;
GRANT SELECT ON public.artist_availability TO anon;
GRANT ALL ON public.artist_availability TO service_role;

ALTER TABLE public.artist_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view availability of published artists"
  ON public.artist_availability FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.tattoo_artists_public p WHERE p.id = artist_id));

CREATE POLICY "Artists manage own availability"
  ON public.artist_availability FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_id AND a.user_id = auth.uid()));

CREATE POLICY "Admins manage all availability"
  ON public.artist_availability FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_artist_availability_updated
  BEFORE UPDATE ON public.artist_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tattoo_artists ADD COLUMN IF NOT EXISTS booking_notes text;