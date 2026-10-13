# Architecture rules
- Artist onboarding is a public form inserting into artist_applications (no Auth accounts for artists); admins approve and copy public fields into the artists table, so private contact data never reaches visitors.
- Orders are created only via create_order; Mercado Pago Checkout Pro uses server-priced orders and authenticated reconciliation or signed webhooks to confirm payments through a service-only atomic RPC; a DB trigger generates all lucky numbers, keeping pricing and numbering server-side.
- Mercado Pago credentials stay server-side; verified provider payments must match order metadata, amount, currency and collector before fulfilment, so redirects never count as payment proof.
- Admin rights come solely from user_roles checked with has_role in RLS; site texts live in the single-row site_settings JSON so the admin can edit them without code changes.
