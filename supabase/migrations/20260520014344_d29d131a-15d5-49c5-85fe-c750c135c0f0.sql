
CREATE POLICY "admins see all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins see all orders" ON public.orders
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins see all order_items" ON public.order_items
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins see all participations" ON public.participations
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins see all credits" ON public.credits
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
