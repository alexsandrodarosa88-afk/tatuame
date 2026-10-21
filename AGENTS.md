# Architecture rules
- Artist onboarding is a public form inserting into artist_applications (no Auth accounts for artists); admins approve and copy public fields into the artists table, so private contact data never reaches visitors.
- Orders are created only via create_order; Mercado Pago Checkout Pro uses server-priced orders and authenticated reconciliation or signed webhooks to confirm payments through a service-only atomic RPC; a DB trigger generates all lucky numbers, keeping pricing and numbering server-side.
- Mercado Pago credentials stay server-side; verified provider payments must match order metadata, amount, currency and collector before fulfilment, so redirects never count as payment proof.
- Admin rights come solely from user_roles checked with has_role in RLS; site texts live in the single-row site_settings JSON so the admin can edit them without code changes.
- All customer-facing and admin copy calls the product "sorteio", while route paths and table names keep the historical "campanha" naming so existing links and bookmarks keep working; past results are labelled "Resultados" to stay distinct from the open raffles list.
- Public card progress calculations and the closing-notice threshold live in raffle-progress, independently of payment enforcement, so presentation changes do not change checkout rules.
- Visual edits use structural element IDs and per-path site_settings.visual overrides applied by VisualRuntime; the same-origin iframe editor only sends drafts and saving remains protected by existing admin RLS, keeping auth/payment behavior unchanged.
