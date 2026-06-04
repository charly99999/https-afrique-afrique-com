
-- 1. Supprimer self-update sur payments (anti-fraude)
DROP POLICY IF EXISTS payments_self_update ON public.payments;

-- 2. Restreindre profiles: pas d'accès public direct
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 3. Vue publique sans téléphone/whatsapp
CREATE OR REPLACE VIEW public.public_profiles
  WITH (security_invoker = true) AS
  SELECT id, display_name, account_type, account_expires_at,
         city, country, avatar_url, bio, created_at
  FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- La vue security_invoker hérite des RLS de profiles → re-permettre lecture publique des colonnes safe
CREATE POLICY profiles_public_safe_read ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
-- Note: la vue n'exposant que les colonnes safe, phone/whatsapp restent protégés via:
-- on révoque l'accès direct à la table pour anon
REVOKE SELECT ON public.profiles FROM anon;
-- authenticated garde l'accès direct (pour les hooks profil), mais phone/whatsapp
-- ne sont jamais affichés à un autre utilisateur car le client utilise la vue.
-- Pour vraiment bloquer la fuite côté authenticated, on retire SELECT sur les colonnes sensibles:
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, account_type, account_expires_at, city, country,
              avatar_url, bio, phone, whatsapp, free_boosts_remaining,
              created_at, updated_at) ON public.profiles TO authenticated;
-- Et on restreint l'accès aux colonnes phone/whatsapp via policy basée sur l'identité
DROP POLICY IF EXISTS profiles_public_safe_read ON public.profiles;
DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_full_read ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- 4. Fonction sécurisée pour récupérer le contact du vendeur (auth requis)
CREATE OR REPLACE FUNCTION public.get_listing_contact(_listing_id uuid)
RETURNS TABLE(phone text, whatsapp text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.phone, p.whatsapp
  FROM public.listings l
  JOIN public.profiles p ON p.id = l.owner_id
  WHERE l.id = _listing_id AND auth.uid() IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;

-- 5. Realtime: enable RLS et autoriser uniquement les utilisateurs authentifiés.
-- Les events postgres_changes restent filtrés par les RLS de public.messages.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "realtime_authenticated_only" ON realtime.messages;
CREATE POLICY "realtime_authenticated_only" ON realtime.messages
  FOR SELECT TO authenticated USING (true);
