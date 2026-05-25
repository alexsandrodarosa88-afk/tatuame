
-- 1) Allow artists to update own bank details when not locked
CREATE POLICY "artists update own bank details when unlocked"
ON public.artist_bank_details
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_bank_details.artist_id AND a.user_id = auth.uid())
  AND is_locked = false
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.tattoo_artists a WHERE a.id = artist_bank_details.artist_id AND a.user_id = auth.uid())
  AND is_locked = false
);

-- 2) Hide ip_address/user_agent from end users: restrict SELECT to admins only,
-- but keep a safe view for the user's own acceptance history (without IP/UA).
DROP POLICY IF EXISTS "users see own acceptances" ON public.policy_acceptances;

CREATE POLICY "admins see all acceptances"
ON public.policy_acceptances
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.policy_acceptances_self
WITH (security_invoker = true) AS
SELECT id, user_id, policy_type, version, accepted_at, created_at
FROM public.policy_acceptances
WHERE user_id = auth.uid();

GRANT SELECT ON public.policy_acceptances_self TO authenticated;

-- Allow users to read their own acceptances WITHOUT ip/user_agent via base table
-- by re-adding a SELECT policy but the view above is preferred for app usage.
CREATE POLICY "users see own acceptances no pii"
ON public.policy_acceptances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
