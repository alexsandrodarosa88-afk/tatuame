
-- 1) Block artist updates on payout_requests (admins still allowed via permissive policy)
CREATE POLICY "block non admin updates on payout_requests"
ON public.payout_requests
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Revoke EXECUTE from anon on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.approve_artist_application(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_free_month(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_artist_application(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_unblock_artist(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.block_overdue_artists() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_completed_campaigns() FROM anon;
REVOKE EXECUTE ON FUNCTION public.distribute_campaign_payouts(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_paid_order(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.allocate_lucky_numbers(uuid, uuid, uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_artist_monthly_fee(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
