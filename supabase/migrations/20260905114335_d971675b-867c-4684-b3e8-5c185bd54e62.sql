-- Revert to invoker semantics (no SECURITY DEFINER view).
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Anonymous visitors may read ONLY safe, non-contact profile columns.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, display_name, account_type, account_expires_at, city, country, avatar_url, bio, created_at, verified, verified_at)
  ON public.profiles TO anon;

-- Row-level access: seller cards are public information.
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON public.public_profiles TO anon, authenticated;
