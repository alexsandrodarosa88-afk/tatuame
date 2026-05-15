
-- Block direct writes to orders/order_items/participations/credits from regular users.
-- All writes must go through SECURITY DEFINER functions or service_role (webhooks).
CREATE POLICY "block user inserts on orders" ON public.orders
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "block user updates on orders" ON public.orders
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY "block user deletes on orders" ON public.orders
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

CREATE POLICY "block user inserts on order_items" ON public.order_items
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "block user updates on order_items" ON public.order_items
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY "block user deletes on order_items" ON public.order_items
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

CREATE POLICY "block user inserts on participations" ON public.participations
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "block user updates on participations" ON public.participations
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY "block user deletes on participations" ON public.participations
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

CREATE POLICY "block user inserts on credits" ON public.credits
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "block user updates on credits" ON public.credits
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY "block user deletes on credits" ON public.credits
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- Make admin-only writes on user_roles unambiguous by adding WITH CHECK
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Defense in depth: explicit restrictive policy that blocks any non-admin write
CREATE POLICY "only admins can write user_roles" ON public.user_roles
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict allocate_lucky_numbers so only service_role (webhook) can execute it.
REVOKE EXECUTE ON FUNCTION public.allocate_lucky_numbers(uuid, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_lucky_numbers(uuid, uuid, uuid, integer) TO service_role;
