-- Sequence for campaign serial numbers (never reused)
CREATE SEQUENCE IF NOT EXISTS public.campaign_code_seq START 1 INCREMENT 1;

-- Add code column
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS code text;

-- Function to generate code like TT-000001
CREATE OR REPLACE FUNCTION public.generate_campaign_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'TT-' || lpad(nextval('public.campaign_code_seq')::text, 6, '0');
$$;

-- Backfill existing rows that don't have a code yet (ordered by creation)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.campaigns WHERE code IS NULL ORDER BY created_at ASC LOOP
    UPDATE public.campaigns SET code = public.generate_campaign_code() WHERE id = r.id;
  END LOOP;
END $$;

-- Enforce uniqueness, not null, and default for new rows
ALTER TABLE public.campaigns
  ALTER COLUMN code SET DEFAULT public.generate_campaign_code();

ALTER TABLE public.campaigns
  ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_code_unique ON public.campaigns(code);

-- Trigger: prevent code from ever being changed once set
CREATE OR REPLACE FUNCTION public.prevent_campaign_code_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'O código da campanha não pode ser alterado';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prevent_campaign_code_change ON public.campaigns;
CREATE TRIGGER trg_prevent_campaign_code_change
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.prevent_campaign_code_change();