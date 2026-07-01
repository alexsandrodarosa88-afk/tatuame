GRANT EXECUTE ON FUNCTION public.generate_campaign_code() TO authenticated, service_role;
GRANT USAGE ON SEQUENCE public.campaign_code_seq TO authenticated, service_role;
-- also cleanup test rows
DELETE FROM public.campaigns WHERE title IN ('TESTE_SIMPLES_DBG','TESTE_SIMPLES_DBG2','TESTE SIMPLES');