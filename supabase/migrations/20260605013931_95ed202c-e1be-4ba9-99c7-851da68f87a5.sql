-- 1. Renforcer le trigger pour bloquer toute modification client de account_type / account_expires_at
CREATE OR REPLACE FUNCTION public.enforce_admin_lifetime_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin : toujours business à vie
  IF public.has_role(NEW.id, 'admin') THEN
    NEW.account_type := 'business';
    NEW.account_expires_at := '2099-12-31 23:59:59+00'::timestamptz;
    RETURN NEW;
  END IF;

  -- Non-admin sur UPDATE : interdire toute modif de ces deux champs
  -- (seul le service_role / les fonctions SECURITY DEFINER côté serveur peuvent les changer)
  IF TG_OP = 'UPDATE' THEN
    IF NEW.account_type IS DISTINCT FROM OLD.account_type
       OR NEW.account_expires_at IS DISTINCT FROM OLD.account_expires_at THEN
      -- Si l'appel vient d'un rôle non-privilégié (anon/authenticated), on reset
      IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
        NEW.account_type := OLD.account_type;
        NEW.account_expires_at := OLD.account_expires_at;
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- S'assurer que le trigger couvre INSERT ET UPDATE
DROP TRIGGER IF EXISTS enforce_admin_lifetime_business_trg ON public.profiles;
CREATE TRIGGER enforce_admin_lifetime_business_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_lifetime_business();

-- 2. Supprimer la policy redondante profiles_public_read (l'accès public passe par la vue public_profiles)
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;