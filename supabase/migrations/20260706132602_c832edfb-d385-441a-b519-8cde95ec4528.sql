
-- 1) Modifier le trigger de protection pour autoriser un bypass interne (GUC)
CREATE OR REPLACE FUNCTION public.protect_listing_sensitive_cols()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _bypass text;
BEGIN
  BEGIN
    _bypass := current_setting('app.bypass_listing_protection', true);
  EXCEPTION WHEN OTHERS THEN
    _bypass := NULL;
  END;

  IF TG_OP = 'UPDATE' THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL
       AND COALESCE(_bypass, '') <> 'on' THEN
      NEW.boosted_until := OLD.boosted_until;
      NEW.views_count := OLD.views_count;
      NEW.favorites_count := OLD.favorites_count;
      NEW.owner_id := OLD.owner_id;
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- 2) Trigger BEFORE INSERT sur listings : auto-boost pour pro/business actifs
CREATE OR REPLACE FUNCTION public.auto_boost_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tier text;
  _exp timestamptz;
BEGIN
  SELECT account_type, account_expires_at
    INTO _tier, _exp
    FROM public.profiles
    WHERE id = NEW.owner_id;

  IF _tier IN ('pro', 'business') AND (_exp IS NULL OR _exp > now()) THEN
    -- Boost jusqu'à l'expiration de l'abonnement (ou très longue durée si null)
    NEW.boosted_until := COALESCE(_exp, '2099-12-31 23:59:59+00'::timestamptz);
  END IF;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_auto_boost_on_insert ON public.listings;
CREATE TRIGGER trg_auto_boost_on_insert
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.auto_boost_on_insert();

-- 3) Trigger sur profiles : quand l'abonnement change, resynchroniser boosted_until
CREATE OR REPLACE FUNCTION public.sync_boosts_on_profile_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _target timestamptz;
BEGIN
  IF NEW.account_type = OLD.account_type
     AND NEW.account_expires_at IS NOT DISTINCT FROM OLD.account_expires_at THEN
    RETURN NEW;
  END IF;

  -- Bypass la protection pour cette transaction
  PERFORM set_config('app.bypass_listing_protection', 'on', true);

  IF NEW.account_type IN ('pro', 'business')
     AND (NEW.account_expires_at IS NULL OR NEW.account_expires_at > now()) THEN
    _target := COALESCE(NEW.account_expires_at, '2099-12-31 23:59:59+00'::timestamptz);
    UPDATE public.listings
       SET boosted_until = _target
     WHERE owner_id = NEW.id
       AND status IN ('active', 'pending')
       AND (boosted_until IS NULL OR boosted_until < _target);
  ELSE
    -- Rétrogradé en gratuit : retirer les boosts "permanents" (au-delà de 60 jours) posés par l'abonnement
    UPDATE public.listings
       SET boosted_until = NULL
     WHERE owner_id = NEW.id
       AND boosted_until IS NOT NULL
       AND boosted_until > now() + interval '60 days';
  END IF;

  PERFORM set_config('app.bypass_listing_protection', 'off', true);
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_sync_boosts_on_profile_change ON public.profiles;
CREATE TRIGGER trg_sync_boosts_on_profile_change
  AFTER UPDATE OF account_type, account_expires_at ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_boosts_on_profile_change();

-- 4) Backfill : booster toutes les annonces actuelles des utilisateurs pro/business actifs
DO $$
BEGIN
  PERFORM set_config('app.bypass_listing_protection', 'on', true);
  UPDATE public.listings l
     SET boosted_until = COALESCE(p.account_expires_at, '2099-12-31 23:59:59+00'::timestamptz)
    FROM public.profiles p
   WHERE l.owner_id = p.id
     AND p.account_type IN ('pro', 'business')
     AND (p.account_expires_at IS NULL OR p.account_expires_at > now())
     AND l.status IN ('active', 'pending')
     AND (l.boosted_until IS NULL
          OR l.boosted_until < COALESCE(p.account_expires_at, '2099-12-31 23:59:59+00'::timestamptz));
  PERFORM set_config('app.bypass_listing_protection', 'off', true);
END $$;
