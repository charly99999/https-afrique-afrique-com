
-- 1) listings: restrict column-level UPDATE for authenticated owners
REVOKE UPDATE ON public.listings FROM authenticated;
GRANT UPDATE (title, description, price_fcfa, negotiable, category_slug, subcategory_slug, country, city, cover_url, status, updated_at)
  ON public.listings TO authenticated;

-- 2) messages: restrict UPDATE to read_at only
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;
