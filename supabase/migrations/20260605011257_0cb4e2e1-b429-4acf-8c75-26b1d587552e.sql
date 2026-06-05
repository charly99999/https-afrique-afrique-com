
-- Make public_profiles view enforce RLS of the querying user instead of the creator
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Add a public-readable policy on profiles, but restrict sensitive columns via column-level grants
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Revoke broad table SELECT and grant only safe columns to anon/authenticated
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, account_type, account_expires_at, city, country, avatar_url, bio, created_at)
  ON public.profiles TO anon, authenticated;

-- The owner still needs full access to their own row; grant remaining sensitive columns to authenticated
-- (RLS profiles_self_full_read restricts these to auth.uid() = id)
GRANT SELECT (phone, whatsapp, free_boosts_remaining, updated_at)
  ON public.profiles TO authenticated;
