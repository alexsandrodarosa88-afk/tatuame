
-- Trigger-only functions: revoke from everyone (triggers run as table owner)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Lucky number allocation: only service_role (called from webhook with admin client)
REVOKE EXECUTE ON FUNCTION public.allocate_lucky_numbers(UUID, UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;

-- has_role used inside RLS policies: keep authenticated execute, revoke anon
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
