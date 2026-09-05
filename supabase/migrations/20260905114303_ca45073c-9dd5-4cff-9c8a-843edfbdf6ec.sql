-- The public_profiles view exposes only safe, non-contact columns.
-- security_invoker=true forced anon to need SELECT on profiles (which holds phone/whatsapp).
-- Switch to definer semantics so public seller info is readable without exposing contact data.
ALTER VIEW public.public_profiles SET (security_invoker = false);

GRANT SELECT ON public.public_profiles TO anon, authenticated;
