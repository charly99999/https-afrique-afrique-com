
-- 1) Fix protect_listing_sensitive_cols: remove reference to non-existent boost_score column
CREATE OR REPLACE FUNCTION public.protect_listing_sensitive_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
      NEW.boosted_until := OLD.boosted_until;
      NEW.views_count := OLD.views_count;
      NEW.favorites_count := OLD.favorites_count;
      NEW.owner_id := OLD.owner_id;
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- 2) Remove duplicate triggers (keep one per concern)
DROP TRIGGER IF EXISTS trg_protect_listing_sensitive ON public.listings;

DROP TRIGGER IF EXISTS trg_admin_lifetime_business ON public.profiles;
DROP TRIGGER IF EXISTS trg_enforce_admin_lifetime ON public.profiles;
DROP TRIGGER IF EXISTS trg_enforce_admin_lifetime_business ON public.profiles;
-- keep enforce_admin_lifetime_business_trg

DROP TRIGGER IF EXISTS trg_protect_verified ON public.profiles;
-- keep protect_verified_trg
