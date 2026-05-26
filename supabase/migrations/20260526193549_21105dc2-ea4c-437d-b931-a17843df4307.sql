UPDATE public.artist_subscriptions
SET status = 'paid',
    paid_at = now(),
    notes = COALESCE(notes,'') || ' [confirmado manualmente pelo admin '|| now()::text ||']'
WHERE id = '4b3b67b8-aeb1-4422-b40c-cb2f72cb96c3';

UPDATE public.tattoo_artists
SET subscription_status = 'active',
    is_active = true,
    subscription_started_at = COALESCE(subscription_started_at, now()),
    subscription_next_due = (CURRENT_DATE + INTERVAL '1 month')::date,
    updated_at = now()
WHERE name ILIKE 'Joce Picoli';