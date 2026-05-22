
ALTER TABLE public.tattoo_artists
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS subscription_billing_type text,
  ADD COLUMN IF NOT EXISTS subscription_next_due date;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tattoo_artists_subscription_status_check') THEN
    ALTER TABLE public.tattoo_artists
      ADD CONSTRAINT tattoo_artists_subscription_status_check
      CHECK (subscription_status IN ('pending','active','overdue','canceled'));
  END IF;
END $$;

ALTER TABLE public.artist_subscriptions
  ADD COLUMN IF NOT EXISTS asaas_payment_id text,
  ADD COLUMN IF NOT EXISTS invoice_url text,
  ADD COLUMN IF NOT EXISTS billing_type text;

CREATE UNIQUE INDEX IF NOT EXISTS artist_subscriptions_asaas_payment_id_key
  ON public.artist_subscriptions(asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;
