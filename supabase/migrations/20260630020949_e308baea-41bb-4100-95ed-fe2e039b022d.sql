-- Restore column-scoped write permissions needed by the app while keeping sensitive fields locked.

-- Listings: no broad UPDATE right; only explicitly safe columns can be changed by authenticated users.
REVOKE UPDATE ON public.listings FROM authenticated;
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

-- Messages: no broad UPDATE right; recipients can only set read_at through RLS.
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

-- Keep table-level access explicit for the flows already governed by RLS.
GRANT SELECT, INSERT, DELETE ON public.listings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Remove accidental write access on the public profile view if any prior grant exposed it.
REVOKE INSERT, UPDATE, DELETE ON public.public_profiles FROM anon, authenticated;

-- Ensure the protective triggers remain installed once, with the current safe implementations.
DROP TRIGGER IF EXISTS trg_protect_listing_sensitive_cols ON public.listings;
CREATE TRIGGER trg_protect_listing_sensitive_cols
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.protect_listing_sensitive_cols();

DROP TRIGGER IF EXISTS trg_protect_message_cols ON public.messages;
CREATE TRIGGER trg_protect_message_cols
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.protect_message_cols();