
-- 1. Add verified flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 2. Trigger: prevent self-verification (only admins / service_role)
CREATE OR REPLACE FUNCTION public.protect_verified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.verified IS DISTINCT FROM OLD.verified
       OR NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
      IF current_setting('request.jwt.claims', true) IS NOT NULL
         AND NOT public.has_role(auth.uid(), 'admin') THEN
        NEW.verified := OLD.verified;
        NEW.verified_at := OLD.verified_at;
      END IF;
    END IF;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF current_setting('request.jwt.claims', true) IS NOT NULL
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.verified := false;
      NEW.verified_at := NULL;
    END IF;
  END IF;
  -- Auto-set verified_at when verified flips to true
  IF NEW.verified = true AND NEW.verified_at IS NULL THEN
    NEW.verified_at := now();
  END IF;
  IF NEW.verified = false THEN
    NEW.verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_verified_trg ON public.profiles;
CREATE TRIGGER protect_verified_trg
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_verified_column();

-- 3. Recreate public_profiles view with verified fields
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, display_name, account_type, account_expires_at,
       city, country, avatar_url, bio, created_at,
       verified, verified_at
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4. Seller stats RPC
CREATE OR REPLACE FUNCTION public.get_seller_stats(_seller_id UUID)
RETURNS TABLE(
  active_listings INT,
  member_since TIMESTAMPTZ,
  verified BOOLEAN,
  verified_at TIMESTAMPTZ,
  trust_score INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _active INT;
  _since TIMESTAMPTZ;
  _verified BOOLEAN;
  _verified_at TIMESTAMPTZ;
  _months INT;
  _score INT;
BEGIN
  SELECT COUNT(*)::INT INTO _active
    FROM public.listings
    WHERE owner_id = _seller_id AND status = 'active';

  SELECT p.created_at, p.verified, p.verified_at
    INTO _since, _verified, _verified_at
    FROM public.profiles p
    WHERE p.id = _seller_id;

  IF _since IS NULL THEN
    RETURN;
  END IF;

  _months := GREATEST(0, EXTRACT(EPOCH FROM (now() - _since))::INT / 2592000);
  _score := (CASE WHEN _verified THEN 30 ELSE 0 END)
          + LEAST(_active, 30)
          + LEAST(_months, 40);

  RETURN QUERY SELECT _active, _since, _verified, _verified_at, _score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_stats(UUID) TO anon, authenticated;
