
-- 1) get_listing_contact: only active listings
CREATE OR REPLACE FUNCTION public.get_listing_contact(_listing_id uuid)
 RETURNS TABLE(phone text, whatsapp text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.phone, p.whatsapp
  FROM public.listings l
  JOIN public.profiles p ON p.id = l.owner_id
  WHERE l.id = _listing_id
    AND l.status = 'active'
    AND auth.uid() IS NOT NULL
$function$;

-- 2) Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_admin_role_granted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_admin_lifetime_business() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sanitize_payment_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_listings_bucket_path(text) FROM PUBLIC, anon, authenticated;

-- 3) Drop favorites from realtime publication (no realtime subscriptions use it)
ALTER PUBLICATION supabase_realtime DROP TABLE public.favorites;

-- 4) Restrict storage SELECT on 'listings' bucket to active listings or owner
DROP POLICY IF EXISTS "Public read listings photos" ON storage.objects;
DROP POLICY IF EXISTS "listings_public_read" ON storage.objects;

CREATE POLICY "listings_active_or_owner_read" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'listings'
  AND (
    -- Owner can always read their own files
    (storage.foldername(name))[1] = (auth.uid())::text
    OR
    -- Public read only if the file belongs to an active listing
    EXISTS (
      SELECT 1
      FROM public.listing_photos lp
      JOIN public.listings l ON l.id = lp.listing_id
      WHERE l.status = 'active'
        AND lp.url LIKE '%' || storage.objects.name
    )
  )
);
