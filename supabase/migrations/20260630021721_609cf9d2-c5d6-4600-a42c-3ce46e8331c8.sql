-- Replace listing RLS policies that depended on a revoked helper function.
-- This prevents publication updates from failing with hidden permission errors.
DROP POLICY IF EXISTS listings_public_read_active ON public.listings;
DROP POLICY IF EXISTS listings_owner_update ON public.listings;
DROP POLICY IF EXISTS listings_owner_delete ON public.listings;

CREATE POLICY listings_public_read_active
ON public.listings
FOR SELECT
TO public
USING (
  status = 'active'::public.listing_status
  OR auth.uid() = owner_id
);

CREATE POLICY listings_owner_update
ON public.listings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'moderator'::public.app_role)
  )
)
WITH CHECK (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin'::public.app_role, 'moderator'::public.app_role)
  )
);

CREATE POLICY listings_owner_delete
ON public.listings
FOR DELETE
TO authenticated
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::public.app_role
  )
);

-- Keep least-privilege column permissions required by the publish flow.
GRANT SELECT, INSERT, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT UPDATE (
  title,
  description,
  price_fcfa,
  negotiable,
  category_slug,
  subcategory_slug,
  country,
  city,
  cover_url,
  status,
  published_at,
  updated_at
) ON public.listings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_photos TO authenticated;
GRANT SELECT ON public.listing_photos TO anon;