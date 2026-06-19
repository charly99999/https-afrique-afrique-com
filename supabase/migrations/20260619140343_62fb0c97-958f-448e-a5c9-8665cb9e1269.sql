-- 1) listing_photos : restreindre l'écriture aux annonces actives/pending
DROP POLICY IF EXISTS listing_photos_owner_write ON public.listing_photos;
CREATE POLICY listing_photos_owner_write ON public.listing_photos
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_photos.listing_id AND l.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_photos.listing_id
      AND l.owner_id = auth.uid()
      AND l.status IN ('active','pending')
  ));

-- 2) reviews : empêcher la modification de seller_id / author_id
CREATE OR REPLACE FUNCTION public.protect_review_keys()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
      NEW.author_id := OLD.author_id;
    END IF;
    IF NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
      NEW.seller_id := OLD.seller_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_review_keys_trg ON public.reviews;
CREATE TRIGGER protect_review_keys_trg
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_keys();