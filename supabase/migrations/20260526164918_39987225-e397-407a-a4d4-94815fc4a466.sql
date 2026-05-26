-- Restrict execution of SECURITY DEFINER functions so anonymous (and unauthorized) users cannot call them.
-- We revoke EXECUTE from PUBLIC and anon for all sensitive functions, then grant back only where needed.

REVOKE EXECUTE ON FUNCTION public.admin_grant_free_month(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_artist_application(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_artist_application(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_unblock_artist(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.block_overdue_artists() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_completed_campaigns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.distribute_campaign_payouts(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.allocate_lucky_numbers(uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_paid_order(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_artist_monthly_fee(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_payout_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_withdrawal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_application() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_bank_details_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_campaign_code_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_campaign_completed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tattoo_artists_billing_unchanged(public.tattoo_artists, public.tattoo_artists) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_campaign_code() FROM PUBLIC, anon, authenticated;

-- Grant EXECUTE back to authenticated only for functions that signed-in users legitimately call via RPC
GRANT EXECUTE ON FUNCTION public.admin_grant_free_month(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_artist_application(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_artist_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unblock_artist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_artist_monthly_fee(uuid) TO authenticated;
