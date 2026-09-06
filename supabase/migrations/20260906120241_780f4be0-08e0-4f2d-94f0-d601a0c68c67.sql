
CREATE OR REPLACE FUNCTION public.expire_due_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1) Abonnements échus
  UPDATE public.subscriptions
     SET active = false
   WHERE active = true
     AND expires_at <= now();

  -- 2) Comptes Pro/Business échus -> Gratuit (les admins sont protégés par trigger)
  UPDATE public.profiles
     SET account_type = 'free',
         account_expires_at = NULL
   WHERE account_type <> 'free'
     AND account_expires_at IS NOT NULL
     AND account_expires_at <= now()
     AND NOT public.has_role(id, 'admin');

  -- 3) Boosts terminés -> retirer la mise en avant
  PERFORM set_config('app.bypass_listing_protection', 'on', true);
  UPDATE public.listings
     SET boosted_until = NULL
   WHERE boosted_until IS NOT NULL
     AND boosted_until <= now();

  -- 4) Annonces actives sans mise à jour depuis 90 jours -> expirées
  UPDATE public.listings
     SET status = 'expired'
   WHERE status = 'active'
     AND updated_at <= now() - interval '90 days';
  PERFORM set_config('app.bypass_listing_protection', 'off', true);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_due_records() FROM public, anon, authenticated;

SELECT cron.schedule('expire_due_records', '7 * * * *', $$SELECT public.expire_due_records();$$);
