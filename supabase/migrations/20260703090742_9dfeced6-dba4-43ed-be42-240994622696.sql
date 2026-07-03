
-- 1) Extensions pour la planification
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2) Fonction d'auto-validation KYC (30 min après soumission)
CREATE OR REPLACE FUNCTION public.auto_review_kyc_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  reason TEXT;
  ok BOOLEAN;
BEGIN
  FOR r IN
    SELECT id, full_name, doc_number, doc_type, doc_front_path, doc_back_path, selfie_path
    FROM public.kyc_submissions
    WHERE status = 'pending'
      AND created_at <= now() - interval '30 minutes'
    LIMIT 200
  LOOP
    ok := TRUE;
    reason := NULL;

    IF r.full_name IS NULL OR length(btrim(r.full_name)) < 4 OR position(' ' IN btrim(r.full_name)) = 0 THEN
      ok := FALSE; reason := 'Nom complet invalide : veuillez indiquer votre nom et prénom tels qu''ils figurent sur le document.';
    ELSIF r.doc_number IS NULL OR length(btrim(r.doc_number)) < 5 THEN
      ok := FALSE; reason := 'Numéro de document invalide ou trop court.';
    ELSIF r.doc_front_path IS NULL OR r.selfie_path IS NULL THEN
      ok := FALSE; reason := 'Photos manquantes : la photo du document et le selfie sont obligatoires.';
    ELSIF r.doc_type <> 'passport' AND r.doc_back_path IS NULL THEN
      ok := FALSE; reason := 'Le verso du document est requis pour ce type de pièce.';
    END IF;

    IF ok THEN
      UPDATE public.kyc_submissions
        SET status = 'approved', reviewed_at = now(), reviewer_notes = 'Vérification automatique validée.'
        WHERE id = r.id;
    ELSE
      UPDATE public.kyc_submissions
        SET status = 'rejected', reviewed_at = now(), reviewer_notes = reason
        WHERE id = r.id;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_review_kyc_submissions() FROM PUBLIC, anon, authenticated;

-- 3) Planifier toutes les 5 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto_review_kyc_submissions') THEN
    PERFORM cron.unschedule('auto_review_kyc_submissions');
  END IF;
  PERFORM cron.schedule(
    'auto_review_kyc_submissions',
    '*/5 * * * *',
    $cron$SELECT public.auto_review_kyc_submissions();$cron$
  );
END $$;

-- 4) Mise à niveau du compte enockdego@gmail.com en Business (2 mois)
UPDATE public.profiles
SET account_type = 'business',
    account_expires_at = now() + interval '2 months'
WHERE id = (SELECT id FROM auth.users WHERE email = 'enockdego@gmail.com');
