ALTER TABLE public.orders ADD COLUMN mp_preference_id text, ADD COLUMN mp_checkout_url text, ADD COLUMN mp_payment_id text UNIQUE, ADD COLUMN mp_payment_status text;
REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE (status) ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;