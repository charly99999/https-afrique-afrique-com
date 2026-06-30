-- Remove direct API execution rights from security-definer functions.
-- RLS policies and triggers can still use these functions internally.
REVOKE EXECUTE ON FUNCTION public.get_seller_stats(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_seller_rating(uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_listing_contact(uuid) FROM public, anon, authenticated;

-- User roles are authentication-only; never expose them to anonymous visitors.
REVOKE SELECT ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;