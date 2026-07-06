
-- LISTINGS : restriction au niveau des colonnes pour les sessions authentifiées
REVOKE UPDATE ON public.listings FROM authenticated;
GRANT UPDATE (
  title, description, price_fcfa, negotiable,
  category_slug, subcategory_slug, country, city,
  cover_url, status, published_at, expires_at
) ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

-- PROFILES : restriction au niveau des colonnes pour les sessions authentifiées
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  display_name, phone, whatsapp, avatar_url, bio,
  city, country, email_opt_in
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
