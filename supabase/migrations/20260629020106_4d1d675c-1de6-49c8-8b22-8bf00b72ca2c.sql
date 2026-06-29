-- Attache les triggers de protection existants (fonctions déjà créées mais non rattachées)
-- 1. Empêche un propriétaire de s'auto-booster ou de modifier les compteurs
DROP TRIGGER IF EXISTS trg_protect_listing_sensitive_cols ON public.listings;
CREATE TRIGGER trg_protect_listing_sensitive_cols
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.protect_listing_sensitive_cols();

-- 2. Empêche un destinataire de modifier body / sender_id / listing_id d'un message
DROP TRIGGER IF EXISTS trg_protect_message_cols ON public.messages;
CREATE TRIGGER trg_protect_message_cols
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_cols();

-- 3. Empêche tout utilisateur authentifié de modifier verified / verified_at (sauf admin)
DROP TRIGGER IF EXISTS trg_protect_verified_column ON public.profiles;
CREATE TRIGGER trg_protect_verified_column
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_verified_column();

-- 4. Empêche un utilisateur de s'auto-attribuer un compte business / expiration / boosts gratuits
DROP TRIGGER IF EXISTS trg_enforce_admin_lifetime_business ON public.profiles;
CREATE TRIGGER trg_enforce_admin_lifetime_business
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_lifetime_business();

-- 5. Garantit que tout paiement créé démarre en "pending" et n'a aucune trace de provider tant que non confirmé
DROP TRIGGER IF EXISTS trg_sanitize_payment_insert ON public.payments;
CREATE TRIGGER trg_sanitize_payment_insert
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_payment_insert();

-- 6. Protège l'auteur et le vendeur d'un avis
DROP TRIGGER IF EXISTS trg_protect_review_keys ON public.reviews;
CREATE TRIGGER trg_protect_review_keys
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_keys();

-- 7. KYC : marque le profil comme vérifié dès qu'un dossier est approuvé
DROP TRIGGER IF EXISTS trg_on_kyc_approved ON public.kyc_submissions;
CREATE TRIGGER trg_on_kyc_approved
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.on_kyc_approved();