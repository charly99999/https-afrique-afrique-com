-- Fix: public_profiles view returned 403 because security_invoker=true
-- required SELECT on profiles for callers. Revert to security_definer
-- (view runs as owner) and grant SELECT only on the view. The view
-- exposes only safe public columns; the underlying profiles table
-- stays inaccessible to anon/authenticated.
ALTER VIEW public.public_profiles SET (security_invoker = false);
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Drop the permissive RLS policy we previously added on profiles —
-- it's unnecessary now that the view runs as definer, and removing it
-- keeps the table strictly locked behind explicit SECURITY DEFINER
-- functions (get_listing_contact, get_seller_stats, etc.).
DROP POLICY IF EXISTS "profiles_public_read_via_view" ON public.profiles;