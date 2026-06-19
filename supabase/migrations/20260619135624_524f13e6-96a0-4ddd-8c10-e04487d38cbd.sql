CREATE OR REPLACE FUNCTION public.enforce_admin_lifetime_business()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin : toujours business à vie
  IF public.has_role(NEW.id, 'admin') THEN
    NEW.account_type := 'business';
    NEW.account_expires_at := '2099-12-31 23:59:59+00'::timestamptz;
    RETURN NEW;
  END IF;

  -- Non-admin sur UPDATE : interdire toute modif des champs privilégiés
  IF TG_OP = 'UPDATE' THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
      IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
        NEW.account_type := OLD.account_type;
      END IF;
      IF NEW.account_expires_at IS DISTINCT FROM OLD.account_expires_at THEN
        NEW.account_expires_at := OLD.account_expires_at;
      END IF;
      IF NEW.free_boosts_remaining IS DISTINCT FROM OLD.free_boosts_remaining THEN
        NEW.free_boosts_remaining := OLD.free_boosts_remaining;
      END IF;
    END IF;
  END IF;

  -- Non-admin sur INSERT : forcer les valeurs par défaut
  IF TG_OP = 'INSERT' THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
      NEW.account_type := COALESCE(
        (SELECT account_type FROM public.profiles WHERE id = NEW.id),
        'gratuit'
      );
      NEW.account_expires_at := NULL;
      NEW.free_boosts_remaining := COALESCE(
        (SELECT free_boosts_remaining FROM public.profiles WHERE id = NEW.id),
        0
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;