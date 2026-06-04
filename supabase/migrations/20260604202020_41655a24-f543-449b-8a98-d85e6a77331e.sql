
-- 1. Photos publiques pour bucket listings (le bucket reste privé mais SELECT public via RLS)
DROP POLICY IF EXISTS "Public read listings photos" ON storage.objects;
CREATE POLICY "Public read listings photos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'listings');

-- 2. Admin = Business à vie : trigger qui force account_type + expiration lointaine
CREATE OR REPLACE FUNCTION public.enforce_admin_lifetime_business()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(NEW.id, 'admin') THEN
    NEW.account_type := 'business';
    NEW.account_expires_at := '2099-12-31 23:59:59+00'::timestamptz;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_admin_lifetime_business ON public.profiles;
CREATE TRIGGER trg_admin_lifetime_business
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_lifetime_business();

-- 3. Quand un user devient admin, on met son profil à business à vie
CREATE OR REPLACE FUNCTION public.on_admin_role_granted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    UPDATE public.profiles
      SET account_type = 'business',
          account_expires_at = '2099-12-31 23:59:59+00'::timestamptz
      WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_on_admin_role_granted ON public.user_roles;
CREATE TRIGGER trg_on_admin_role_granted
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.on_admin_role_granted();

-- 4. Application immédiate pour tous les admins existants
UPDATE public.profiles p
  SET account_type = 'business',
      account_expires_at = '2099-12-31 23:59:59+00'::timestamptz
  WHERE public.has_role(p.id, 'admin');
