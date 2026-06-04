
REVOKE EXECUTE ON FUNCTION public.enforce_admin_lifetime_business() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_admin_role_granted() FROM PUBLIC, anon, authenticated;
