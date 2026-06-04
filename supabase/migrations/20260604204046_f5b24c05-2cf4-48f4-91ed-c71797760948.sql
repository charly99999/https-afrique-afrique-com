CREATE OR REPLACE FUNCTION public.normalize_listings_bucket_path(_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  marker text := '/storage/v1/object/public/listings/';
  marker_pos integer;
BEGIN
  IF _url IS NULL OR _url = '' THEN
    RETURN _url;
  END IF;

  marker_pos := strpos(_url, marker);
  IF marker_pos > 0 THEN
    RETURN substring(_url from marker_pos + char_length(marker));
  END IF;

  RETURN _url;
END;
$$;

UPDATE public.listing_photos
SET url = public.normalize_listings_bucket_path(url)
WHERE url LIKE '%/storage/v1/object/public/listings/%';

UPDATE public.listings
SET cover_url = public.normalize_listings_bucket_path(cover_url)
WHERE cover_url LIKE '%/storage/v1/object/public/listings/%';