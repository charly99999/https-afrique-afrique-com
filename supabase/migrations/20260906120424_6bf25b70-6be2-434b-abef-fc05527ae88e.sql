-- lovable-cron-fallback-reviewed: 144 runs/day; filet de sécurité obligatoire — l'IPN PayDunya a déjà échoué (33 paiements bloqués). Un client ne doit pas attendre plus de 10 minutes l'activation de son abonnement/boost payé.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT vault.create_secret(
  'b278ec73825a0d8fd13e9870deb3b3b627b1e9482c380172',
  'cron_internal_secret',
  'Secret partagé entre pg_cron et les endpoints /api/public/hooks/*'
);

CREATE OR REPLACE FUNCTION public.call_internal_hook(_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  _secret text;
BEGIN
  SELECT decrypted_secret INTO _secret
    FROM vault.decrypted_secrets WHERE name = 'cron_internal_secret';
  IF _secret IS NULL THEN RETURN; END IF;

  PERFORM net.http_post(
    url := 'https://project--1e5a8259-5a8e-46ed-82a8-53ee4d3981db.lovable.app' || _path,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.call_internal_hook(text) FROM public, anon, authenticated;

SELECT cron.schedule(
  'reconcile_payments',
  '*/10 * * * *',
  $$SELECT public.call_internal_hook('/api/public/hooks/reconcile-payments');$$
);

SELECT cron.schedule(
  'push_boost_nudge',
  '23 * * * *',
  $$SELECT public.call_internal_hook('/api/public/hooks/push-boost-nudge');$$
);
