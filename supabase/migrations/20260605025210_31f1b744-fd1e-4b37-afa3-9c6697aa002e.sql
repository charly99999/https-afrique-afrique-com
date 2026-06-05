ALTER VIEW public.public_profiles SET (security_invoker = true);

CREATE POLICY "profiles_public_read_via_view"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);