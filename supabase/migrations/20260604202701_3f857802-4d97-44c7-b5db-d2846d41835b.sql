
-- 1. Anti-fraude paiements : forcer status=pending et nettoyer les champs sensibles à l'insert
CREATE OR REPLACE FUNCTION public.sanitize_payment_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.status := 'pending';
  NEW.provider_response := NULL;
  NEW.completed_at := NULL;
  NEW.provider_token := NULL;
  NEW.provider_invoice_url := NULL;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.sanitize_payment_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sanitize_payment_insert ON public.payments;
CREATE TRIGGER trg_sanitize_payment_insert
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  WHEN (current_setting('role', true) <> 'service_role')
  EXECUTE FUNCTION public.sanitize_payment_insert();

-- 2. Photos : restreint aux annonces actives
DROP POLICY IF EXISTS "listing_photos_public_read" ON public.listing_photos;
CREATE POLICY "listing_photos_active_read" ON public.listing_photos
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_photos.listing_id AND l.status = 'active'
  ));
