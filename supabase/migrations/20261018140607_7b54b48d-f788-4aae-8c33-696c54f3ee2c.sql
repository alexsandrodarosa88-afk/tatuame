CREATE TABLE public.draws (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL, campaign_title text NOT NULL, drawn_at date NOT NULL DEFAULT current_date, winning_number integer, winner_name text, live_url text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.draws TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.draws TO authenticated;
GRANT ALL ON public.draws TO service_role;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "draws public read" ON public.draws FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "draws admin write" ON public.draws FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));