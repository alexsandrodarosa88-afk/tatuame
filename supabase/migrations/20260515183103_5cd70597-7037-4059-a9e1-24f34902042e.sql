ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_total_quotas_max_300;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_total_quotas_max_999
  CHECK (total_quotas > 0 AND total_quotas <= 999);