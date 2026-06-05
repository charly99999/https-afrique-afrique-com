-- Recreate public_profiles as a SECURITY DEFINER view so anonymous visitors
-- can read only the safe public columns without exposing the full profiles table.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, display_name, account_type, account_expires_at, city, country, avatar_url, bio, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;