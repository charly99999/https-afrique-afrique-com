
-- 1) Backfill : tous les utilisateurs non-admin passent en business jusqu'au 25/11/2026
DO $$
DECLARE
  _target timestamptz := (now() + interval '4 months');
BEGIN
  PERFORM set_config('app.bypass_listing_protection', 'on', true);

  UPDATE public.profiles p
     SET account_type = 'business',
         account_expires_at = _target
   WHERE NOT public.has_role(p.id, 'admin')
     AND (p.account_type <> 'business'
          OR p.account_expires_at IS NULL
          OR p.account_expires_at < _target);

  PERFORM set_config('app.bypass_listing_protection', 'off', true);
END $$;

-- 2) Nouveaux utilisateurs : business offert 4 mois
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone, account_type, account_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.phone,
    'business',
    now() + interval '4 months'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;

-- 3) Trigger enforce_admin_lifetime_business : lors d'un INSERT initié par un utilisateur
--    (jwt claims présents), forcer les valeurs par défaut à l'offre gratuite 4 mois
CREATE OR REPLACE FUNCTION public.enforce_admin_lifetime_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(NEW.id, 'admin') THEN
    NEW.account_type := 'business';
    NEW.account_expires_at := '2099-12-31 23:59:59+00'::timestamptz;
    RETURN NEW;
  END IF;

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

  IF TG_OP = 'INSERT' THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
      NEW.account_type := COALESCE(
        (SELECT account_type FROM public.profiles WHERE id = NEW.id),
        'business'
      );
      NEW.account_expires_at := COALESCE(
        (SELECT account_expires_at FROM public.profiles WHERE id = NEW.id),
        now() + interval '4 months'
      );
      NEW.free_boosts_remaining := COALESCE(
        (SELECT free_boosts_remaining FROM public.profiles WHERE id = NEW.id),
        0
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
