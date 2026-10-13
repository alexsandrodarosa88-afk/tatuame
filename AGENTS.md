# Architecture rules
- Artist onboarding is a public form inserting into artist_applications (no Auth accounts for artists); admins approve and copy public fields into the artists table, so private contact data never reaches visitors.
- Orders are created only via the create_order RPC and become paid only by admin update; a DB trigger generates lucky numbers on payment, keeping pricing and numbering server-side.
- Admin rights come solely from user_roles checked with has_role in RLS; site texts live in the single-row site_settings JSON so the admin can edit them without code changes.
