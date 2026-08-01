
-- 1) Retirer les privilèges d'écriture excessifs accordés au rôle anonyme
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c
           WHERE c.relnamespace='public'::regnamespace AND c.relkind='r'
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon', t.relname);
  END LOOP;
END $$;

-- Les lectures publiques restent possibles (RLS s'applique)
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.listing_photos TO anon;
GRANT SELECT ON public.reviews TO anon;

-- 2) Journalisation des échecs de publication
CREATE TABLE public.publish_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid,
  step text NOT NULL,
  error_code text,
  message text NOT NULL,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.publish_errors TO authenticated;
GRANT ALL ON public.publish_errors TO service_role;

ALTER TABLE public.publish_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_publish_errors_insert" ON public.publish_errors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_publish_errors_select" ON public.publish_errors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_publish_errors_created_at ON public.publish_errors (created_at DESC);
