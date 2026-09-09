GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_seller_rating(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_seller_stats(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_contact() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_listing_event(uuid, text, text) TO authenticated, anon;
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT UPDATE ON public.listings TO authenticated;