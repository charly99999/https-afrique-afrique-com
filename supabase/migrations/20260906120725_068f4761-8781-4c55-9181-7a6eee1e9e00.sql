
-- ============ 1. Type d'annonce : Vente / Troc / Don ============
DO $$ BEGIN
  CREATE TYPE public.deal_type AS ENUM ('vente','troc','don');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS deal_type public.deal_type NOT NULL DEFAULT 'vente';

CREATE INDEX IF NOT EXISTS listings_deal_type_idx ON public.listings (deal_type, status);

-- ============ 2. Suspension de compte ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- ============ 3. Journal des actions d'administration ============
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_actions_read ON public.admin_actions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_actions_insert ON public.admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- ============ 4. Signalement de profil ============
CREATE TABLE public.profile_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profile_reports_open_idx ON public.profile_reports (resolved, created_at DESC);

GRANT SELECT, INSERT ON public.profile_reports TO authenticated;
GRANT UPDATE (resolved) ON public.profile_reports TO authenticated;
GRANT ALL ON public.profile_reports TO service_role;
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_reports_insert ON public.profile_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND profile_id <> auth.uid());
CREATE POLICY profile_reports_read ON public.profile_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY profile_reports_admin_update ON public.profile_reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ 5. Recherches sauvegardées / alertes ============
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  query text,
  category_slug text,
  subcategory_slug text,
  country public.country_code,
  city text,
  min_price bigint,
  max_price bigint,
  deal_type public.deal_type,
  alerts_enabled boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX saved_searches_user_idx ON public.saved_searches (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_searches_own ON public.saved_searches
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 6. Accès administrateur aux tables existantes ============
CREATE POLICY listings_admin_all ON public.listings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY payments_admin_read ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY subscriptions_admin_read ON public.subscriptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY boosts_admin_read ON public.boosts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY reports_admin_update ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_read ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Les admins doivent pouvoir lire tout le profil (y compris contact) pour la modération
CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid, display_name text, phone text, whatsapp text, city text,
  country public.country_code, account_type public.account_type,
  account_expires_at timestamptz, verified boolean, suspended_at timestamptz,
  created_at timestamptz, is_admin boolean, listings_count integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT p.id, p.display_name, p.phone, p.whatsapp, p.city, p.country,
         p.account_type, p.account_expires_at, p.verified, p.suspended_at,
         p.created_at,
         public.has_role(p.id, 'admin'),
         (SELECT COUNT(*)::int FROM public.listings l WHERE l.owner_id = p.id)
  FROM public.profiles p
  WHERE _search IS NULL OR _search = ''
     OR p.display_name ILIKE '%' || _search || '%'
     OR p.phone ILIKE '%' || _search || '%'
     OR p.city ILIKE '%' || _search || '%'
  ORDER BY p.created_at DESC
  LIMIT GREATEST(LEAST(COALESCE(_limit, 50), 200), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'users', (SELECT COUNT(*) FROM public.profiles),
    'users_new_7d', (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'listings_total', (SELECT COUNT(*) FROM public.listings),
    'listings_active', (SELECT COUNT(*) FROM public.listings WHERE status = 'active'),
    'listings_pending', (SELECT COUNT(*) FROM public.listings WHERE status = 'pending'),
    'reports_open', (SELECT COUNT(*) FROM public.reports WHERE resolved = false)
                    + (SELECT COUNT(*) FROM public.profile_reports WHERE resolved = false),
    'payments_pending', (SELECT COUNT(*) FROM public.payments WHERE status = 'pending'),
    'payments_completed', (SELECT COUNT(*) FROM public.payments WHERE status = 'completed'),
    'revenue_fcfa', (SELECT COALESCE(SUM(amount_fcfa),0) FROM public.payments WHERE status = 'completed'),
    'subscriptions_active', (SELECT COUNT(*) FROM public.subscriptions WHERE active AND expires_at > now()),
    'boosts_active', (SELECT COUNT(*) FROM public.boosts WHERE expires_at > now()),
    'suspended', (SELECT COUNT(*) FROM public.profiles WHERE suspended_at IS NOT NULL)
  ) INTO r;
  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_suspension(_user_id uuid, _suspended boolean, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF public.has_role(_user_id, 'admin') THEN
    RAISE EXCEPTION 'Un administrateur ne peut pas etre suspendu';
  END IF;

  UPDATE public.profiles
     SET suspended_at = CASE WHEN _suspended THEN now() ELSE NULL END,
         suspension_reason = CASE WHEN _suspended THEN _reason ELSE NULL END
   WHERE id = _user_id;

  IF _suspended THEN
    PERFORM set_config('app.bypass_listing_protection', 'on', true);
    UPDATE public.listings SET status = 'suspended'
     WHERE owner_id = _user_id AND status IN ('active','pending');
    PERFORM set_config('app.bypass_listing_protection', 'off', true);
  END IF;

  INSERT INTO public.admin_actions (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(), CASE WHEN _suspended THEN 'suspend_user' ELSE 'unsuspend_user' END,
          'profile', _user_id, _reason);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_suspension(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_suspension(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_listing_status(_listing_id uuid, _status public.listing_status, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  PERFORM set_config('app.bypass_listing_protection', 'on', true);
  UPDATE public.listings SET status = _status WHERE id = _listing_id;
  PERFORM set_config('app.bypass_listing_protection', 'off', true);

  INSERT INTO public.admin_actions (admin_id, action, target_type, target_id, reason, metadata)
  VALUES (auth.uid(), 'set_listing_status', 'listing', _listing_id, _reason,
          jsonb_build_object('status', _status));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_listing_status(uuid, public.listing_status, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_listing_status(uuid, public.listing_status, text) TO authenticated;

-- ============ 7. Les comptes suspendus ne publient plus ============
CREATE OR REPLACE FUNCTION public.block_suspended_authors()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.owner_id AND suspended_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Votre compte est suspendu. Contactez le support.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_block_suspended_authors
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.block_suspended_authors();
