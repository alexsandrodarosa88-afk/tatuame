ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment_id ON public.orders(asaas_payment_id);