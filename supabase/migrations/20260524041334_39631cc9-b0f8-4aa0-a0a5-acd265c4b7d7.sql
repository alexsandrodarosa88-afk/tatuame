
-- 0) Add 'completed' to enum if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'campaign_status' AND e.enumlabel = 'completed'
  ) THEN
    ALTER TYPE public.campaign_status ADD VALUE 'completed';
  END IF;
END $$;

-- 1) site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
CREATE POLICY "site_settings public read"
  ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings admin write" ON public.site_settings;
CREATE POLICY "site_settings admin write"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_site_settings_updated ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) site-assets storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site-assets public read" ON storage.objects;
CREATE POLICY "site-assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "site-assets admin insert" ON storage.objects;
CREATE POLICY "site-assets admin insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "site-assets admin update" ON storage.objects;
CREATE POLICY "site-assets admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "site-assets admin delete" ON storage.objects;
CREATE POLICY "site-assets admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

-- 3) Auto-expire function (cannot reference new enum value in same tx as ADD VALUE,
--    so we use text cast)
CREATE OR REPLACE FUNCTION public.expire_completed_campaigns()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.campaigns
     SET status = 'completed'::public.campaign_status, updated_at = now()
   WHERE status = 'active'
     AND (ends_at <= now() OR sold_quotas >= total_quotas);
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END $$;

-- 4) Schedule pg_cron every 10 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('expire-campaigns');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-campaigns',
  '*/10 * * * *',
  $$ SELECT public.expire_completed_campaigns(); $$
);

-- 5) Seed default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hero.badge', 'Você nunca perde — seu dinheiro vira crédito'),
  ('hero.title', 'Sua próxima tatuagem pode custar'),
  ('hero.title_highlight', 'muito menos.'),
  ('hero.subtitle', 'Transforme sua participação em crédito e desbloqueie upgrades exclusivos com os melhores tatuadores.'),
  ('hero.cta_primary', 'Garantir minha vaga'),
  ('hero.cta_secondary', 'Como funciona'),
  ('hero.image', ''),
  ('hero.stat1_value', '12 meses'),
  ('hero.stat1_label', 'Validade do crédito'),
  ('hero.stat2_value', '70%'),
  ('hero.stat2_label', 'Pode pagar da tatuagem'),
  ('hero.stat3_value', '4'),
  ('hero.stat3_label', 'Campanhas ativas'),
  ('campaigns.eyebrow', 'Campanhas ativas'),
  ('campaigns.title', 'Escolha sua campanha e garanta seu número.'),
  ('campaigns.subtitle', 'Cada compra gera um número único. Quando a campanha fecha, um sorteado leva o upgrade completo da tatuagem.'),
  ('how.eyebrow', 'Como funciona'),
  ('how.title', 'Simples, justo e transparente.'),
  ('how.step1_title', 'Compre crédito'),
  ('how.step1_desc', 'Escolha o valor e adicione crédito à sua conta. Válido por 12 meses.'),
  ('how.step2_title', 'Receba seu número'),
  ('how.step2_desc', 'Cada compra gera um número promocional único e exclusivo.'),
  ('how.step3_title', 'Participe da campanha'),
  ('how.step3_desc', 'Acompanhe o progresso em tempo real até o fechamento.'),
  ('how.step4_title', 'Garanta seu upgrade'),
  ('how.step4_desc', 'O sorteado leva a tatuagem completa. Todos saem com crédito.'),
  ('guarantee.title', 'Você nunca perde.'),
  ('guarantee.title_highlight', 'Seu dinheiro vira tatuagem.'),
  ('guarantee.point1', 'Toda compra vira crédito na sua conta'),
  ('guarantee.point2', 'Crédito válido por 12 meses, sem letras miúdas'),
  ('guarantee.point3', 'Use para pagar até 70% de qualquer tatuagem'),
  ('guarantee.point4', 'Disponível com todos os tatuadores parceiros'),
  ('social.eyebrow', 'Quem já tatuou'),
  ('social.title', 'Histórias reais, tinta de verdade.'),
  ('social.t1_name', 'Marina Costa'),
  ('social.t1_role', 'São Paulo, SP'),
  ('social.t1_text', 'Comprei R$30 em crédito e acabei levando uma tatuagem de R$2.000. Nunca tinha visto algo assim no Brasil.'),
  ('social.t2_name', 'Ricardo Alves'),
  ('social.t2_role', 'Rio de Janeiro, RJ'),
  ('social.t2_text', 'Mesmo sem ganhar o sorteio, usei meu crédito para pagar parte da tatuagem. Saí no lucro de qualquer jeito.'),
  ('social.t3_name', 'Juliana Mendes'),
  ('social.t3_role', 'Belo Horizonte, MG'),
  ('social.t3_text', 'Plataforma séria, tatuadores incríveis e a campanha foi super transparente. Recomendo demais.'),
  ('social.image1', ''),
  ('social.image2', ''),
  ('social.image3', ''),
  ('finalcta.title', 'Sua próxima tatuagem está a um clique.'),
  ('finalcta.subtitle', 'Entre agora, garanta seu número e transforme cada real em arte.'),
  ('finalcta.button', 'Entrar agora'),
  ('footer.copyright', 'TATUAME — Todos os direitos reservados.'),
  ('footer.logo', '')
ON CONFLICT (key) DO NOTHING;
