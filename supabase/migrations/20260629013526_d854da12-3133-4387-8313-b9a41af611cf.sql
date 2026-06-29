
-- 1) Listings: bloquer l'auto-modification des colonnes sensibles
CREATE OR REPLACE FUNCTION public.protect_listing_sensitive_cols()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Si l'appel vient d'un utilisateur authentifié (JWT présent),
    -- on remet les valeurs originales sur les colonnes protégées.
    IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
      NEW.boosted_until := OLD.boosted_until;
      NEW.views_count := OLD.views_count;
      NEW.favorites_count := OLD.favorites_count;
      NEW.boost_score := OLD.boost_score;
      NEW.owner_id := OLD.owner_id;
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_listing_sensitive ON public.listings;
CREATE TRIGGER trg_protect_listing_sensitive
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.protect_listing_sensitive_cols();

-- 2) Messages: les destinataires ne peuvent modifier que read_at
CREATE OR REPLACE FUNCTION public.protect_message_cols()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
      NEW.body := OLD.body;
      NEW.sender_id := OLD.sender_id;
      NEW.recipient_id := OLD.recipient_id;
      NEW.listing_id := OLD.listing_id;
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_message_cols ON public.messages;
CREATE TRIGGER trg_protect_message_cols
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_cols();

-- 3) Profiles: attacher les triggers de protection existants
DROP TRIGGER IF EXISTS trg_enforce_admin_lifetime ON public.profiles;
CREATE TRIGGER trg_enforce_admin_lifetime
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_lifetime_business();

DROP TRIGGER IF EXISTS trg_protect_verified ON public.profiles;
CREATE TRIGGER trg_protect_verified
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_verified_column();

-- 4) Reviews & KYC : attacher leurs triggers existants
DROP TRIGGER IF EXISTS trg_protect_review_keys ON public.reviews;
CREATE TRIGGER trg_protect_review_keys
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_keys();

DROP TRIGGER IF EXISTS trg_on_kyc_approved ON public.kyc_submissions;
CREATE TRIGGER trg_on_kyc_approved
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.on_kyc_approved();

-- 5) Payments : interdire toute manipulation côté client (status, etc.)
DROP TRIGGER IF EXISTS trg_sanitize_payment_insert ON public.payments;
CREATE TRIGGER trg_sanitize_payment_insert
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_payment_insert();

-- 6) handle_new_user : attacher si manquant
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) Storage : remplacer le match suffix dangereux par une égalité exacte
DROP POLICY IF EXISTS listings_active_or_owner_read ON storage.objects;
CREATE POLICY listings_active_or_owner_read ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (
    bucket_id = 'listings'
    AND (
      (storage.foldername(name))[1] = COALESCE((auth.uid())::text, '___')
      OR EXISTS (
        SELECT 1 FROM public.listing_photos lp
        JOIN public.listings l ON l.id = lp.listing_id
        WHERE l.status = 'active'
          AND lp.url = objects.name
      )
    )
  );
