-- Contact details (phone/whatsapp) are no longer readable through the table by any role.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, city, country, avatar_url, bio, account_type,
              account_expires_at, free_boosts_remaining, created_at, updated_at,
              verified, verified_at, email_opt_in)
  ON public.profiles TO authenticated;

-- Own contact details, for the profile/settings screens.
CREATE OR REPLACE FUNCTION public.get_my_contact()
RETURNS TABLE (phone text, whatsapp text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.phone, p.whatsapp
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_contact() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_contact() TO authenticated;

-- Seller contact for a given active listing, signed-in users only.
CREATE OR REPLACE FUNCTION public.get_listing_contact(_listing_id uuid)
RETURNS TABLE (phone text, whatsapp text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.phone, COALESCE(p.whatsapp, p.phone)
  FROM public.listings l
  JOIN public.profiles p ON p.id = l.owner_id
  WHERE l.id = _listing_id
    AND l.status = 'active'
    AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_listing_contact(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;
