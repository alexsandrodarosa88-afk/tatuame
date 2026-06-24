
REVOKE EXECUTE ON FUNCTION public.activate_premium_plan(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_artist_payout_factor(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_week_promotion_tasks(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_premium_recurring_payment(uuid, text, numeric, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.activate_premium_plan(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.compute_artist_payout_factor(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_week_promotion_tasks(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_premium_recurring_payment(uuid, text, numeric, text, text) TO service_role;
