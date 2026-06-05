-- Switch view to security_invoker so RLS of the caller applies
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Grant SELECT on only the safe/public columns of profiles
GRANT SELECT (id, display_name, account_type, account_expires_at, city, country, avatar_url, bio, created_at, verified, verified_at)
  ON public.profiles TO anon, authenticated;

-- Allow anon to read rows through RLS (column grants restrict which columns)
DROP POLICY IF EXISTS profiles_public_safe_read ON public.profiles;
CREATE POLICY profiles_public_safe_read
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
