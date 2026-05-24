
-- 1) policy_type column on existing acceptances
ALTER TABLE public.policy_acceptances
  ADD COLUMN IF NOT EXISTS policy_type text NOT NULL DEFAULT 'client';

-- 2) payout_requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  user_id uuid NOT NULL,
  campaign_id uuid,
  winner_name text NOT NULL,
  winner_cpf text,
  winner_phone text,
  winner_email text,
  tattoo_value numeric NOT NULL DEFAULT 0,
  is_partial boolean NOT NULL DEFAULT false,
  sessions_total int,
  sessions_done int,
  signed_term_url text NOT NULL,
  tattoo_photo_url text NOT NULL,
  extra_photo_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | paid | rejected
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artists insert own payout requests" ON public.payout_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_id AND a.user_id = auth.uid())
  );
CREATE POLICY "artists see own payout requests" ON public.payout_requests
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage payout requests" ON public.payout_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payout_requests_updated
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admin on new payout request
CREATE OR REPLACE FUNCTION public.notify_admin_payout_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _artist_name text;
BEGIN
  SELECT name INTO _artist_name FROM public.tattoo_artists WHERE id = NEW.artist_id;
  INSERT INTO public.admin_notifications (type, title, message, link, related_id)
  VALUES (
    'payout_request',
    'Nova solicitação de pagamento de tattoo',
    COALESCE(_artist_name,'Tatuador') || ' solicitou pagamento de R$ ' || NEW.tattoo_value::text || ' (cliente: ' || NEW.winner_name || ')',
    '/admin/saques',
    NEW.id
  );
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_admin_payout_request
  AFTER INSERT ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_payout_request();

-- 3) service_terms (termo gerado pelo tatuador, com assinaturas)
CREATE TABLE IF NOT EXISTS public.service_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  user_id uuid NOT NULL,
  artist_name text NOT NULL,
  artist_cpf text,
  artist_address text,
  client_name text NOT NULL,
  client_cpf text,
  client_phone text,
  client_address text,
  tattoo_description text NOT NULL,
  tattoo_value numeric NOT NULL DEFAULT 0,
  campaign_code text,
  is_prize boolean NOT NULL DEFAULT true,
  sessions_total int,
  artist_signature text, -- nome digitado como assinatura
  artist_signed_at timestamptz,
  client_signature text,
  client_signed_at timestamptz,
  client_receipt_signature text, -- assinatura final de recebimento
  client_received_at timestamptz,
  generated_pdf_url text,
  status text NOT NULL DEFAULT 'draft', -- draft | signed | completed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artists manage own service terms" ON public.service_terms
  FOR ALL USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  ) WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_service_terms_updated
  BEFORE UPDATE ON public.service_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Storage bucket for artist documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-documents', 'artist-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "artist read own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'artist-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "artist upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'artist-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "artist update own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'artist-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "admin delete artist documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'artist-documents'
    AND public.has_role(auth.uid(), 'admin')
  );
