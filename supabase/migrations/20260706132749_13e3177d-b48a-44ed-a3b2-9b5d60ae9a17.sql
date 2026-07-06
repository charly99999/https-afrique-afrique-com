
-- 1) LISTINGS : durcir auto_boost_on_insert
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
  IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
    NEW.boosted_until := NULL;
    SELECT account_type, account_expires_at INTO _tier, _exp
      FROM public.profiles WHERE id = NEW.owner_id;
    IF _tier IN ('pro', 'business') AND (_exp IS NULL OR _exp > now()) THEN
      NEW.boosted_until := COALESCE(_exp, '2099-12-31 23:59:59+00'::timestamptz);
    END IF;
  END IF;
  RETURN NEW;
END $function$;

REVOKE ALL ON FUNCTION public.auto_boost_on_insert() FROM PUBLIC, anon, authenticated;

-- 2) MESSAGES : restriction au niveau des colonnes
REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

-- 3) STORAGE : supprimer les politiques en double sur le bucket avatars
DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;

-- 4) Politique de lecture unique et propre sur les avatars : accessible à tous (avatars destinés à l'affichage public sur les fiches vendeurs)
CREATE POLICY "avatars_public_read_single" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
