ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_total_quotas_max_300
  CHECK (total_quotas > 0 AND total_quotas <= 300);